import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { Prisma } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './products.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async createProduct(orgId: string, dto: CreateProductDto) {
    // Check SKU uniqueness
    const existing = await this.prisma.product.findFirst({
      where: { organizationId: orgId, sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" já existe nesta organização`);
    }

    const product = await this.prisma.product.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        costPrice: new Prisma.Decimal(dto.costPrice),
        salePrice: new Prisma.Decimal(dto.salePrice),
        unit: dto.unit || 'un',
        stockQuantity: dto.stockQuantity || 0,
        minStock: dto.minStock || 5,
        isActive: dto.isActive !== false,
        metadata: dto.metadata || {},
      },
    });

    // Check if stock is below minimum
    if (product.stockQuantity <= product.minStock) {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.STOCK_LOW,
        source: 'products-service',
        payload: {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stockQuantity,
          minStock: product.minStock,
        },
      });
    }

    this.logger.log(`Product created: ${product.id} (${product.sku}) for org ${orgId}`);
    return product;
  }

  async getProducts(orgId: string, filters: { category?: string; search?: string; active?: boolean; page?: number; perPage?: number }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId };
    if (filters.category) where.category = filters.category;
    if (filters.active !== undefined) where.isActive = filters.active;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getProduct(orgId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId: orgId },
      include: { transactionItems: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async updateProduct(orgId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Produto não encontrado');

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        costPrice: dto.costPrice !== undefined ? new Prisma.Decimal(dto.costPrice) : undefined,
        salePrice: dto.salePrice !== undefined ? new Prisma.Decimal(dto.salePrice) : undefined,
        unit: dto.unit,
        stockQuantity: dto.stockQuantity,
        minStock: dto.minStock,
        isActive: dto.isActive,
        metadata: dto.metadata,
      },
    });
  }

  async deleteProduct(orgId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, organizationId: orgId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    // Soft delete — mark as inactive
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Produto desativado' };
  }

  async adjustStock(orgId: string, id: string, quantity: number, reason: string) {
    const product = await this.prisma.product.findFirst({ where: { id, organizationId: orgId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const newStock = product.stockQuantity + quantity;
    if (newStock < 0) throw new ConflictException('Estoque não pode ficar negativo');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stockQuantity: newStock },
    });

    // Check low stock
    if (updated.stockQuantity <= updated.minStock) {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.STOCK_LOW,
        source: 'products-service',
        payload: {
          productId: id,
          name: updated.name,
          sku: updated.sku,
          currentStock: updated.stockQuantity,
          minStock: updated.minStock,
          reason,
        },
      });
    }

    return { stockQuantity: updated.stockQuantity, adjusted: quantity, reason };
  }
}
