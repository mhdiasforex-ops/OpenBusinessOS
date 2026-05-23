import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async createSupplier(orgId: string, dto: any) {
    return this.prisma.supplier.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        document: dto.document,
        address: dto.address || {},
        notes: dto.notes,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getSuppliers(orgId: string, filters: { isActive?: string; search?: string; page?: number; perPage?: number }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { _count: { select: { contracts: true, purchaseOrders: true } } },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getSupplier(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId: orgId },
      include: {
        contracts: { orderBy: { createdAt: 'desc' }, take: 20 },
        purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    return supplier;
  }

  async updateSupplier(orgId: string, id: string, dto: any) {
    const existing = await this.prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Fornecedor não encontrado');

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
    const supplier = await this.prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');

    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Fornecedor removido' };
  }
}
