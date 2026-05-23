import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';
import {
  PaymentProvider,
  PaymentProviderName,
  PaymentStatus,
  PaymentMethod,
  CreatePaymentDto,
  CreatePaymentConfigDto,
  QueryPaymentDto,
} from './payment.dto';
import { AsaasProvider } from './providers/asaas.provider';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';

// ── Provider Registry ──────────────────────────────────────────────────

const PROVIDER_MAP: Record<string, new (...args: any[]) => PaymentProvider> = {
  ASAAS: AsaasProvider,
  MERCADO_PAGO: MercadoPagoProvider,
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private redis: Redis,
  ) {}

  // ── Provider Resolution ────────────────────────────────────────────

  private getProviderInstance(providerName: PaymentProviderName): PaymentProvider {
    const ProviderClass = PROVIDER_MAP[providerName];
    if (!ProviderClass) throw new NotFoundException(`Provedor ${providerName} não implementado`);
    return new ProviderClass();
  }

  // ── Config CRUD ────────────────────────────────────────────────────

  async createConfig(orgId: string, dto: CreatePaymentConfigDto) {
    return this.prisma.paymentConfig.create({
      data: {
        organizationId: orgId,
        provider: dto.provider,
        apiKey: dto.apiKey,
        webhookSecret: dto.webhookSecret,
        sandbox: dto.sandbox ?? false,
        settings: dto.settings ?? {},
      },
    });
  }

  async getConfigs(orgId: string) {
    return this.prisma.paymentConfig.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDefaultConfig(orgId: string) {
    const config = await this.prisma.paymentConfig.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
    if (!config) throw new NotFoundException('Nenhuma configuração de pagamento encontrada');
    return config;
  }

  async deleteConfig(orgId: string, configId: string) {
    const config = await this.prisma.paymentConfig.findFirst({
      where: { id: configId, organizationId: orgId },
    });
    if (!config) throw new NotFoundException('Configuração não encontrada');
    return this.prisma.paymentConfig.delete({ where: { id: configId } });
  }

  // ── Create Charge ──────────────────────────────────────────────────

  async createPayment(orgId: string, dto: CreatePaymentDto) {
    const config = await this.getDefaultConfig(orgId);
    const provider = this.getProviderInstance(config.provider as PaymentProviderName);

    const result = await provider.createCharge({
      amount: dto.amount,
      method: dto.method,
      customerId: dto.customerId,
      description: dto.description,
      dueDate: dto.dueDate,
      metadata: dto.metadata,
    });

    return this.prisma.payment.create({
      data: {
        organizationId: orgId,
        customerId: dto.customerId,
        provider: config.provider,
        method: dto.method,
        amount: dto.amount,
        fee: result.fee,
        netAmount: result.netAmount,
        status: result.status,
        externalId: result.externalId,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        metadata: dto.metadata ?? {},
        pixCode: result.pixCode,
        pixQrCode: result.pixQrCode,
        boletoUrl: result.boletoUrl,
        boletoBarCode: result.boletoBarCode,
      },
    });
  }

  // ── List Payments ──────────────────────────────────────────────────

  async getPayments(orgId: string, query: QueryPaymentDto) {
    const page = 1;
    const perPage = 50;
    const where: any = { organizationId: orgId };

    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.provider) where.provider = query.provider;
    if (query.customerId) where.customerId = query.customerId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate!);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate!);
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, take: perPage }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getPayment(orgId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return payment;
  }

  // ── Check Status ───────────────────────────────────────────────────

  async checkPaymentStatus(orgId: string, id: string) {
    const payment = await this.getPayment(orgId, id);
    const config = await this.getDefaultConfig(orgId);
    const provider = this.getProviderInstance(config.provider as PaymentProviderName);

    const result = await provider.checkStatus(payment.externalId);

    return this.prisma.payment.update({
      where: { id },
      data: {
        status: result.status,
        paidAt: result.paidAt,
      },
    });
  }

  // ── Cancel ─────────────────────────────────────────────────────────

  async cancelPayment(orgId: string, id: string) {
    const payment = await this.getPayment(orgId, id);
    const config = await this.getDefaultConfig(orgId);
    const provider = this.getProviderInstance(config.provider as PaymentProviderName);

    await provider.cancelCharge(payment.externalId);

    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
    });
  }

  // ── Refund ─────────────────────────────────────────────────────────

  async refundPayment(orgId: string, id: string) {
    const payment = await this.getPayment(orgId, id);
    const config = await this.getDefaultConfig(orgId);
    const provider = this.getProviderInstance(config.provider as PaymentProviderName);

    await provider.refundCharge(payment.externalId);

    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.REFUNDED },
    });
  }

  // ── Webhook ────────────────────────────────────────────────────────

  async processWebhook(orgId: string, providerName: string, payload: any, signature?: string) {
    const config = await this.prisma.paymentConfig.findFirst({
      where: { organizationId: orgId, provider: providerName as any },
    });
    if (!config) throw new NotFoundException(`Config do provedor ${providerName} não encontrada`);

    const provider = this.getProviderInstance(config.provider as PaymentProviderName);
    const result = await provider.processWebhook(payload, signature);

    const payment = await this.prisma.payment.findFirst({
      where: { organizationId: orgId, externalId: result.externalId },
    });
    if (!payment) {
      this.logger.warn(`Webhook: pagamento ${result.externalId} não encontrado para org ${orgId}`);
      return result;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: result.status,
        paidAt: result.paidAt,
        fee: result.fee ?? payment.fee,
      },
    });

    return result;
  }

  // ── Stats ──────────────────────────────────────────────────────────

  async getStats(orgId: string) {
    const byStatus = await this.prisma.payment.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    });

    const byMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { organizationId: orgId },
      _sum: { amount: true, netAmount: true },
      _count: { id: true },
    });

    const total = await this.prisma.payment.aggregate({
      where: { organizationId: orgId, status: PaymentStatus.CONFIRMED },
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    });

    return {
      totalConfirmed: {
        count: total._count.id,
        amount: total._sum.amount ?? 0,
        fees: total._sum.fee ?? 0,
        net: total._sum.netAmount ?? 0,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        amount: s._sum.amount ?? 0,
        fees: s._sum.fee ?? 0,
        net: s._sum.netAmount ?? 0,
      })),
      byMethod: byMethod.map((m) => ({
        method: m.method,
        count: m._count.id,
        amount: m._sum.amount ?? 0,
        net: m._sum.netAmount ?? 0,
      })),
    };
  }
}
