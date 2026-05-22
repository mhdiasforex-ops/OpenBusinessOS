import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { CustomerSegment } from '@prisma/client';
import { CreateCustomerDto, UpdateCustomerDto, CreateCampaignDto } from './crm.dto';
import { LtvService } from './ltv.service';
import { SegmentationService } from './segmentation.service';
import { ChurnDetectorService } from './churn-detector.service';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private ltvService: LtvService,
    private segmentationService: SegmentationService,
    private churnDetectorService: ChurnDetectorService,
  ) {}

  // --- Customers (CRUD) ---

  async createCustomer(orgId: string, dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        document: dto.document,
        segment: (dto.segment || 'NEW') as CustomerSegment,
        tags: dto.tags || [],
        metadata: dto.metadata || {},
      },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.CUSTOMER_CREATED,
      source: 'crm-service',
      payload: {
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        segment: customer.segment,
      },
    });

    return customer;
  }

  async getCustomers(orgId: string, filters: { segment?: string; search?: string; page?: number; perPage?: number }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId };
    if (filters.segment) where.segment = filters.segment;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getCustomer(orgId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId: orgId },
      include: {
        transactions: {
          where: { type: 'INCOME', status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async updateCustomer(orgId: string, id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Cliente não encontrado');

    return this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        document: dto.document,
        segment: dto.segment ? (dto.segment as CustomerSegment) : undefined,
        tags: dto.tags,
        metadata: dto.metadata,
      },
    });
  }

  async deleteCustomer(orgId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, organizationId: orgId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    await this.prisma.customer.delete({ where: { id } });
    return { message: 'Cliente removido' };
  }

  // --- LTV (delegado) ---

  async calculateLTV(orgId: string, customerId: string) {
    return this.ltvService.calculateLTV(orgId, customerId);
  }

  // --- Segmentation + Churn (delegado) ---

  async segmentCustomers(orgId: string) {
    const result = await this.segmentationService.segmentCustomers(orgId);

    // Emitir churn risk events para clientes AT_RISK
    if (result.churnRiskCustomerIds.length > 0) {
      await this.churnDetectorService.detectAndEmitChurnRisk(orgId, result.churnRiskCustomerIds);
    }

    return {
      segments: result.segments,
      totalCustomers: result.totalCustomers,
      churnRiskCount: result.churnRiskCount,
    };
  }

  // --- Campaigns (simplified — stores in metadata for MVP) ---

  async createCampaign(orgId: string, dto: CreateCampaignDto) {
    this.logger.log(`Criando campanha "${dto.name}" via ${dto.channel}`);

    // For MVP, campaigns are stored as events
    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.CAMPAIGN_SENT,
      source: 'crm-service',
      payload: {
        campaignId: `camp_${Date.now()}`,
        name: dto.name,
        recipientCount: dto.recipientCount,
        channel: dto.channel,
      },
    });

    return {
      id: `camp_${Date.now()}`,
      name: dto.name,
      channel: dto.channel,
      segment: dto.segment,
      recipientCount: dto.recipientCount,
      message: dto.message,
      status: 'SENT',
    };
  }
}
