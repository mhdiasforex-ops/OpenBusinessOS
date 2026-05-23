import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType, ContractStatus } from '@prisma/client';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async createContract(orgId: string, dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        organizationId: orgId,
        title: dto.title,
        description: dto.description,
        type: dto.type ? (dto.type as ContractType) : ContractType.OTHER,
        status: ContractStatus.DRAFT,
        supplierId: dto.supplierId,
        customerId: dto.customerId,
        value: dto.value ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        metadata: dto.metadata || {},
      },
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async getContracts(
    orgId: string,
    filters: { status?: string; type?: string; search?: string; page?: number; perPage?: number },
  ) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId };
    if (filters.status) where.status = filters.status as ContractStatus;
    if (filters.type) where.type = filters.type as ContractType;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getContract(orgId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, organizationId: orgId },
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return contract;
  }

  async updateContract(orgId: string, id: string, dto: UpdateContractDto) {
    const existing = await this.prisma.contract.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Contrato não encontrado');

    return this.prisma.contract.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type ? (dto.type as ContractType) : undefined,
        status: dto.status ? (dto.status as ContractStatus) : undefined,
        supplierId: dto.supplierId,
        customerId: dto.customerId,
        value: dto.value,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        metadata: dto.metadata,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async deleteContract(orgId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({ where: { id, organizationId: orgId } });
    if (!contract) throw new NotFoundException('Contrato não encontrado');

    await this.prisma.contract.delete({ where: { id } });
    return { message: 'Contrato removido' };
  }
}
