import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import {
  CreateStockMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  StockMovementType,
  PurchaseOrderStatus,
} from './inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // ── Stock Movements ──────────────────────────────────────────────────

  async createMovement(orgId: string, dto: CreateStockMovementDto, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId: orgId },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');

    // Calculate new stock
    let delta = 0;
    switch (dto.type) {
      case StockMovementType.IN:
      case StockMovementType.RETURN:
        delta = dto.quantity;
        break;
      case StockMovementType.OUT:
        delta = -dto.quantity;
        break;
      case StockMovementType.ADJUSTMENT:
        delta = dto.quantity; // positive = increase, negative = decrease (use negative quantity)
        break;
      case StockMovementType.TRANSFER:
        delta = -dto.quantity; // outbound transfer
        break;
    }

    const newStock = product.stockQuantity + delta;

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          organizationId: orgId,
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          reference: dto.reference,
          costPrice: dto.costPrice,
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { stockQuantity: newStock },
      }),
    ]);

    // Emit event for low-stock alert
    if (newStock <= product.minStock) {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.STOCK_LOW,
        source: 'inventory-service',
        payload: {
          productId: product.id,
          productName: product.name,
          currentStock: newStock,
          minStock: product.minStock,
        },
      });
    }

    if (newStock === 0) {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.STOCK_OUT,
        source: 'inventory-service',
        payload: {
          productId: product.id,
          productName: product.name,
        },
      });
    }

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'STOCK_MOVEMENT_CREATED',
      source: 'inventory-service',
      payload: {
        movementId: movement.id,
        productId: dto.productId,
        type: dto.type,
        quantity: dto.quantity,
      },
    });

    return movement;
  }

  async getMovements(orgId: string, filters: { productId?: string; type?: string; page?: number; perPage?: number }) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };
    if (filters.productId) where.productId = filters.productId;
    if (filters.type) where.type = filters.type;

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getLowStock(orgId: string) {
    // Prisma doesn't support cross-column comparisons in where
    // Use $queryRaw for this
    return this.prisma.$queryRaw`
      SELECT * FROM products
      WHERE "organizationId" = ${orgId}
      AND is_active = true
      AND stock_quantity <= min_stock
      ORDER BY stock_quantity ASC
    `;
  }

  // ── Suppliers ────────────────────────────────────────────────────────

  async createSupplier(orgId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        document: dto.document,
        address: dto.address ?? {},
        notes: dto.notes,
      },
    });
  }

  async getSuppliers(orgId: string, filters: { isActive?: boolean; page?: number; perPage?: number }) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getSupplier(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    return supplier;
  }

  async updateSupplier(orgId: string, id: string, dto: UpdateSupplierDto) {
    await this.getSupplier(orgId, id);
    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        document: dto.document,
        address: dto.address,
        notes: dto.notes,
        isActive: dto.isActive,
      },
    });
  }

  async deleteSupplier(orgId: string, id: string) {
    await this.getSupplier(orgId, id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  // ── Purchase Orders ──────────────────────────────────────────────────

  async createPurchaseOrder(orgId: string, dto: CreatePurchaseOrderDto) {
    await this.getSupplier(orgId, dto.supplierId);

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const total = items.reduce((sum, item) => sum + item.total, 0);

    const count = await this.prisma.purchaseOrder.count({ where: { organizationId: orgId } });
    const number = `PO-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.purchaseOrder.create({
      data: {
        organizationId: orgId,
        supplierId: dto.supplierId,
        number,
        status: PurchaseOrderStatus.DRAFT,
        items: items as any,
        total,
        notes: dto.notes,
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
      },
    });
  }

  async getPurchaseOrders(orgId: string, filters: { status?: string; supplierId?: string; page?: number; perPage?: number }) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };
    if (filters.status) where.status = filters.status;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async updatePurchaseOrderStatus(orgId: string, id: string, status: string) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, organizationId: orgId } });
    if (!po) throw new NotFoundException('Pedido de compra não encontrado');
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: status as any } });
  }
}
