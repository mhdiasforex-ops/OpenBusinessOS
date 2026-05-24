import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFiltersDto } from './suppliers.dto';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  async createSupplier(orgId: string, dto: CreateSupplierDto) {
    // Verificar unicidade do document (CNPJ) dentro da organização
    if (dto.document) {
      const existing = await this.prisma.supplier.findFirst({
        where: { organizationId: orgId, document: dto.document },
      });
      if (existing) {
        throw new ConflictException(`CNPJ "${dto.document}" já existe nesta organização`);
      }
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        document: dto.document ?? null,
        address: dto.address ?? {},
        notes: dto.notes ?? null,
        isActive: dto.isActive !== false,
      },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.SUPPLIER_CREATED,
      source: 'suppliers-service',
      payload: {
        supplierId: supplier.id,
        name: supplier.name,
        document: supplier.document,
        email: supplier.email,
      },
    });

    this.logger.log(`Supplier created: ${supplier.id} (${supplier.name}) for org ${orgId}`);
    return supplier;
  }

  // ──────────────────────────────────────────────
  // READ (list with filters + pagination)
  // ──────────────────────────────────────────────

  async getSuppliers(orgId: string, filters: SupplierFiltersDto) {
    const page = Math.max(Number(filters.page) || 1, 1);
    const perPage = Math.min(Math.max(Number(filters.perPage) || 25, 1), 100);

    const where: any = { organizationId: orgId };

    if (filters.isActive !== undefined && filters.isActive !== '') {
      where.isActive = filters.isActive === 'true';
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          _count: {
            select: { contracts: true, purchaseOrders: true },
          },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
        hasNext: page * perPage < total,
        hasPrev: page > 1,
      },
    };
  }

  // ──────────────────────────────────────────────
  // READ (one by ID)
  // ──────────────────────────────────────────────

  async getSupplier(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { contracts: true, purchaseOrders: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return supplier;
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  async updateSupplier(orgId: string, id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Se está alterando o document, verificar unicidade
    if (dto.document && dto.document !== existing.document) {
      const duplicate = await this.prisma.supplier.findFirst({
        where: { organizationId: orgId, document: dto.document, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException(`CNPJ "${dto.document}" já existe nesta organização`);
      }
    }

    const updated = await this.prisma.supplier.update({
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

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.SUPPLIER_UPDATED,
      source: 'suppliers-service',
      payload: {
        supplierId: id,
        changes: dto,
      },
    });

    this.logger.log(`Supplier updated: ${id} for org ${orgId}`);
    return updated;
  }

  // ──────────────────────────────────────────────
  // DELETE (soft delete — desativa o fornecedor)
  // ──────────────────────────────────────────────

  async deleteSupplier(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Soft delete — marca como inativo em vez de remover
    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.SUPPLIER_DEACTIVATED,
      source: 'suppliers-service',
      payload: {
        supplierId: id,
        name: supplier.name,
        reason: 'Exclusão via API (soft delete)',
      },
    });

    this.logger.log(`Supplier deactivated (soft delete): ${id} for org ${orgId}`);
    return { message: 'Fornecedor desativado com sucesso' };
  }

  // ──────────────────────────────────────────────
  // TOGGLE ACTIVE (ativar/desativar rapidamente)
  // ──────────────────────────────────────────────

  async toggleActive(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const newStatus = !supplier.isActive;

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: { isActive: newStatus },
    });

    // Emitir evento apenas se desativou
    if (!newStatus) {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.SUPPLIER_DEACTIVATED,
        source: 'suppliers-service',
        payload: {
          supplierId: id,
          name: supplier.name,
        },
      });
    } else {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.SUPPLIER_UPDATED,
        source: 'suppliers-service',
        payload: {
          supplierId: id,
          changes: { isActive: true },
        },
      });
    }

    this.logger.log(`Supplier toggled: ${id} -> isActive=${newStatus} for org ${orgId}`);
    return {
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
    };
  }
}
