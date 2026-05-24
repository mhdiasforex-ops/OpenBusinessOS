import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreatePaymentConfigDto, CreatePaymentDto, QueryPaymentDto, PaymentStatus, PaymentMethod } from './payment.dto';

const mockProvider = {
  createCharge: vi.fn(),
  checkStatus: vi.fn(),
  cancelCharge: vi.fn(),
  refundCharge: vi.fn(),
  processWebhook: vi.fn(),
};

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      paymentConfig: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
    };

    vi.clearAllMocks();
    service = new PaymentService(prisma as unknown as PrismaService);
    vi.spyOn(service as any, 'getProviderInstance').mockReturnValue(mockProvider);
  });

  const orgId = 'org-abc';

  // ── Config CRUD ────────────────────────────────────────────────────

  describe('createConfig', () => {
    const dto: CreatePaymentConfigDto = {
      provider: 'ASAAS' as any,
      apiKey: 'sk_live_abc123',
      webhookSecret: 'whsec_xyz',
      sandbox: true,
      settings: { maxRetries: 3 },
    };

    it('should create a payment config', async () => {
      const created = { id: 'cfg-1', organizationId: orgId, ...dto };
      prisma.paymentConfig.create.mockResolvedValue(created);

      const result = await service.createConfig(orgId, dto);

      expect(prisma.paymentConfig.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          provider: dto.provider,
          apiKey: dto.apiKey,
          webhookSecret: dto.webhookSecret,
          sandbox: true,
          settings: { maxRetries: 3 },
        },
      });
      expect(result).toEqual(created);
    });

    it('should apply defaults for sandbox and settings', async () => {
      const minimalDto: CreatePaymentConfigDto = { provider: 'MANUAL' as any, apiKey: '' };
      prisma.paymentConfig.create.mockResolvedValue({ id: 'cfg-2' });

      await service.createConfig(orgId, minimalDto);

      const call = prisma.paymentConfig.create.mock.calls[0][0];
      expect(call.data.sandbox).toBe(false);
      expect(call.data.settings).toEqual({});
    });
  });

  describe('getConfigs', () => {
    it('should return configs for org ordered by createdAt desc', async () => {
      const configs = [{ id: 'cfg-1', provider: 'ASAAS' }, { id: 'cfg-2', provider: 'MANUAL' }];
      prisma.paymentConfig.findMany.mockResolvedValue(configs);

      const result = await service.getConfigs(orgId);

      expect(result).toEqual(configs);
      expect(prisma.paymentConfig.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getDefaultConfig', () => {
    it('should return the latest config for org', async () => {
      const config = { id: 'cfg-1', provider: 'ASAAS' };
      prisma.paymentConfig.findFirst.mockResolvedValue(config);

      const result = await service.getDefaultConfig(orgId);

      expect(result).toEqual(config);
      expect(prisma.paymentConfig.findFirst).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw NotFoundException when no config exists', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(null);

      await expect(service.getDefaultConfig(orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteConfig', () => {
    it('should delete existing config', async () => {
      const config = { id: 'cfg-1', organizationId: orgId };
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      prisma.paymentConfig.delete.mockResolvedValue(config);

      const result = await service.deleteConfig(orgId, 'cfg-1');

      expect(prisma.paymentConfig.findFirst).toHaveBeenCalledWith({
        where: { id: 'cfg-1', organizationId: orgId },
      });
      expect(prisma.paymentConfig.delete).toHaveBeenCalledWith({ where: { id: 'cfg-1' } });
      expect(result).toEqual(config);
    });

    it('should throw NotFoundException when config does not exist', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(null);

      await expect(service.deleteConfig(orgId, 'missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when config belongs to different org', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(null);

      await expect(service.deleteConfig('other-org', 'cfg-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Create Payment ─────────────────────────────────────────────────

  describe('createPayment', () => {
    const config = { id: 'cfg-1', provider: 'ASAAS', apiKey: 'key' };
    const chargeResult = {
      externalId: 'ext-123',
      status: PaymentStatus.PENDING,
      pixCode: 'pix-code-123',
      pixQrCode: 'qr-data',
      boletoUrl: 'https://boleto.com',
      boletoBarCode: '123456',
      fee: 5.0,
      netAmount: 95.0,
    };

    const dto: CreatePaymentDto = {
      customerId: 'cust-1',
      method: PaymentMethod.PIX,
      amount: 100.0,
      description: 'Test payment',
      dueDate: '2026-06-01',
      metadata: { orderId: 'ord-1' },
    };

    it('should create a payment successfully', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.createCharge.mockResolvedValue(chargeResult);
      const createdPayment = { id: 'pay-1', organizationId: orgId, ...dto, ...chargeResult };
      prisma.payment.create.mockResolvedValue(createdPayment);

      const result = await service.createPayment(orgId, dto);

      expect(prisma.paymentConfig.findFirst).toHaveBeenCalled();
      expect(mockProvider.createCharge).toHaveBeenCalledWith({
        amount: dto.amount,
        method: dto.method,
        customerId: dto.customerId,
        description: dto.description,
        dueDate: dto.dueDate,
        metadata: dto.metadata,
      });
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          customerId: dto.customerId,
          provider: 'ASAAS',
          method: dto.method,
          amount: dto.amount,
          fee: 5.0,
          netAmount: 95.0,
          status: PaymentStatus.PENDING,
          externalId: 'ext-123',
          description: dto.description,
          dueDate: new Date(dto.dueDate),
          metadata: dto.metadata,
          pixCode: 'pix-code-123',
          pixQrCode: 'qr-data',
          boletoUrl: 'https://boleto.com',
          boletoBarCode: '123456',
        },
      });
      expect(result).toEqual(createdPayment);
    });

    it('should handle missing optional fields in dto', async () => {
      const minimalDto: CreatePaymentDto = { method: PaymentMethod.CREDIT_CARD, amount: 50 };
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.createCharge.mockResolvedValue(chargeResult);
      prisma.payment.create.mockResolvedValue({ id: 'pay-2' });

      await service.createPayment(orgId, minimalDto);

      const createCall = prisma.payment.create.mock.calls[0][0];
      expect(createCall.data.customerId).toBeUndefined();
      expect(createCall.data.description).toBeUndefined();
      expect(createCall.data.dueDate).toBeNull();
      expect(createCall.data.metadata).toEqual({});
    });

    it('should throw when no default config exists', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(null);

      await expect(service.createPayment(orgId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should pass dto fields through to provider.createCharge', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.createCharge.mockResolvedValue(chargeResult);
      prisma.payment.create.mockResolvedValue({ id: 'pay-2' });

      await service.createPayment(orgId, dto);

      expect(mockProvider.createCharge).toHaveBeenCalledWith({
        amount: dto.amount,
        method: dto.method,
        customerId: dto.customerId,
        description: dto.description,
        dueDate: dto.dueDate,
        metadata: dto.metadata,
      });
    });
  });

  // ── Get Payments ───────────────────────────────────────────────────

  describe('getPayments', () => {
    const query: QueryPaymentDto = {};

    it('should return paginated payments', async () => {
      prisma.payment.findMany.mockResolvedValue([{ id: 'pay-1' }, { id: 'pay-2' }]);
      prisma.payment.count.mockResolvedValue(10);

      const result = await service.getPayments(orgId, query);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(50);
    });

    it('should filter by status', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { status: PaymentStatus.CONFIRMED });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.status).toBe(PaymentStatus.CONFIRMED);
    });

    it('should filter by method', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { method: PaymentMethod.PIX });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.method).toBe(PaymentMethod.PIX);
    });

    it('should filter by provider', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { provider: 'ASAAS' as any });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.provider).toBe('ASAAS');
    });

    it('should filter by customerId', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { customerId: 'cust-1' });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.customerId).toBe('cust-1');
    });

    it('should filter by date range', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { startDate: '2026-01-01', endDate: '2026-12-31' });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.createdAt).toBeDefined();
      expect(call.where.createdAt.gte).toBeInstanceOf(Date);
      expect(call.where.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should filter by startDate only', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { startDate: '2026-06-01' });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.createdAt.gte).toBeInstanceOf(Date);
      expect(call.where.createdAt.lte).toBeUndefined();
    });

    it('should filter by endDate only', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await service.getPayments(orgId, { endDate: '2026-12-31' });

      const call = prisma.payment.findMany.mock.calls[0][0];
      expect(call.where.createdAt.lte).toBeInstanceOf(Date);
      expect(call.where.createdAt.gte).toBeUndefined();
    });
  });

  // ── Get Payment ────────────────────────────────────────────────────

  describe('getPayment', () => {
    it('should return payment when it exists for org', async () => {
      const payment = { id: 'pay-1', organizationId: orgId, amount: 100 };
      prisma.payment.findFirst.mockResolvedValue(payment);

      const result = await service.getPayment(orgId, 'pay-1');

      expect(result).toEqual(payment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { id: 'pay-1', organizationId: orgId },
      });
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.getPayment(orgId, 'missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when payment belongs to different org', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.getPayment('other-org', 'pay-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Check Payment Status ───────────────────────────────────────────

  describe('checkPaymentStatus', () => {
    const payment = { id: 'pay-1', organizationId: orgId, externalId: 'ext-123', status: PaymentStatus.PENDING };
    const config = { id: 'cfg-1', provider: 'ASAAS' };
    const statusResult = { externalId: 'ext-123', status: PaymentStatus.CONFIRMED, paidAt: new Date('2026-05-24') };

    it('should check status and update payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(payment);
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.checkStatus.mockResolvedValue(statusResult);
      const updated = { ...payment, status: PaymentStatus.CONFIRMED, paidAt: statusResult.paidAt };
      prisma.payment.update.mockResolvedValue(updated);

      const result = await service.checkPaymentStatus(orgId, 'pay-1');

      expect(mockProvider.checkStatus).toHaveBeenCalledWith('ext-123');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.CONFIRMED, paidAt: statusResult.paidAt },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when payment has no externalId', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', organizationId: orgId, externalId: null });

      await expect(service.checkPaymentStatus(orgId, 'pay-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.checkPaymentStatus(orgId, 'missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Cancel Payment ─────────────────────────────────────────────────

  describe('cancelPayment', () => {
    const payment = { id: 'pay-1', organizationId: orgId, externalId: 'ext-123' };
    const config = { id: 'cfg-1', provider: 'ASAAS' };

    it('should cancel payment with provider and update status', async () => {
      prisma.payment.findFirst.mockResolvedValue(payment);
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.cancelCharge.mockResolvedValue({ success: true });
      const updated = { ...payment, status: PaymentStatus.CANCELLED };
      prisma.payment.update.mockResolvedValue(updated);

      const result = await service.cancelPayment(orgId, 'pay-1');

      expect(mockProvider.cancelCharge).toHaveBeenCalledWith('ext-123');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.CANCELLED },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when payment has no externalId', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', organizationId: orgId, externalId: null });

      await expect(service.cancelPayment(orgId, 'pay-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.cancelPayment(orgId, 'missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Refund Payment ─────────────────────────────────────────────────

  describe('refundPayment', () => {
    const payment = { id: 'pay-1', organizationId: orgId, externalId: 'ext-123' };
    const config = { id: 'cfg-1', provider: 'ASAAS' };

    it('should refund payment with provider and update status', async () => {
      prisma.payment.findFirst.mockResolvedValue(payment);
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.refundCharge.mockResolvedValue({ success: true });
      const updated = { ...payment, status: PaymentStatus.REFUNDED };
      prisma.payment.update.mockResolvedValue(updated);

      const result = await service.refundPayment(orgId, 'pay-1');

      expect(mockProvider.refundCharge).toHaveBeenCalledWith('ext-123');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.REFUNDED },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when payment has no externalId', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', organizationId: orgId, externalId: null });

      await expect(service.refundPayment(orgId, 'pay-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.refundPayment(orgId, 'missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Webhook ────────────────────────────────────────────────────────

  describe('processWebhook', () => {
    const config = { id: 'cfg-1', organizationId: orgId, provider: 'ASAAS', webhookSecret: 'whsec_xyz' };
    const webhookResult = { externalId: 'ext-123', status: PaymentStatus.CONFIRMED, paidAt: new Date('2026-05-24'), fee: 4.5 };
    const payload = { event: 'payment_confirmed', id: 'ext-123' };
    const signature = 'sha256=abc123';

    it('should process webhook and update existing payment', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.processWebhook.mockResolvedValue(webhookResult);
      const existingPayment = { id: 'pay-1', organizationId: orgId, externalId: 'ext-123', fee: 3.0 };
      prisma.payment.findFirst.mockResolvedValue(existingPayment);
      prisma.payment.update.mockResolvedValue({ ...existingPayment, status: PaymentStatus.CONFIRMED, paidAt: webhookResult.paidAt, fee: 4.5 });

      const result = await service.processWebhook(orgId, 'ASAAS', payload, signature);

      expect(prisma.paymentConfig.findFirst).toHaveBeenCalledWith({
        where: { organizationId: orgId, provider: 'ASAAS' },
      });
      expect(mockProvider.processWebhook).toHaveBeenCalledWith(payload, signature);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { organizationId: orgId, externalId: 'ext-123' },
      });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: {
          status: PaymentStatus.CONFIRMED,
          paidAt: webhookResult.paidAt,
          fee: 4.5,
        },
      });
      expect(result).toEqual(webhookResult);
    });

    it('should process webhook without signature', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.processWebhook.mockResolvedValue(webhookResult);
      prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', organizationId: orgId, externalId: 'ext-123', fee: 3.0 });
      prisma.payment.update.mockResolvedValue({});

      await service.processWebhook(orgId, 'ASAAS', payload);

      expect(mockProvider.processWebhook).toHaveBeenCalledWith(payload, undefined);
    });

    it('should log warning and return result when payment is not found', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.processWebhook.mockResolvedValue(webhookResult);
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await service.processWebhook(orgId, 'ASAAS', payload);

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(result).toEqual(webhookResult);
    });

    it('should fall back to existing fee when webhook result has no fee', async () => {
      const resultWithoutFee = { externalId: 'ext-123', status: PaymentStatus.CONFIRMED, paidAt: new Date('2026-05-24') };
      prisma.paymentConfig.findFirst.mockResolvedValue(config);
      mockProvider.processWebhook.mockResolvedValue(resultWithoutFee);
      prisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', organizationId: orgId, externalId: 'ext-123', fee: 3.0 });
      prisma.payment.update.mockResolvedValue({});

      await service.processWebhook(orgId, 'ASAAS', payload);

      const updateCall = prisma.payment.update.mock.calls[0][0];
      expect(updateCall.data.fee).toBe(3.0);
    });

    it('should throw NotFoundException when config is not found', async () => {
      prisma.paymentConfig.findFirst.mockResolvedValue(null);

      await expect(service.processWebhook(orgId, 'UNKNOWN', payload)).rejects.toThrow(NotFoundException);
    });
  });

  // ── Stats ──────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      prisma.payment.groupBy
        .mockResolvedValueOnce([
          { status: PaymentStatus.CONFIRMED, _sum: { amount: 1000, fee: 50, netAmount: 950 }, _count: { id: 5 } },
          { status: PaymentStatus.PENDING, _sum: { amount: 200, fee: 10, netAmount: 190 }, _count: { id: 2 } },
        ])
        .mockResolvedValueOnce([
          { method: PaymentMethod.PIX, _sum: { amount: 600, netAmount: 580 }, _count: { id: 3 } },
          { method: PaymentMethod.CREDIT_CARD, _sum: { amount: 400, netAmount: 370 }, _count: { id: 2 } },
        ]);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 1000, fee: 50, netAmount: 950 },
        _count: { id: 5 },
      });

      const result = await service.getStats(orgId);

      expect(prisma.payment.groupBy).toHaveBeenCalledTimes(2);
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        where: { organizationId: orgId, status: PaymentStatus.CONFIRMED },
        _sum: { amount: true, fee: true, netAmount: true },
        _count: { id: true },
      });

      expect(result.totalConfirmed).toEqual({
        count: 5,
        amount: 1000,
        fees: 50,
        net: 950,
      });

      expect(result.byStatus).toEqual([
        { status: PaymentStatus.CONFIRMED, count: 5, amount: 1000, fees: 50, net: 950 },
        { status: PaymentStatus.PENDING, count: 2, amount: 200, fees: 10, net: 190 },
      ]);

      expect(result.byMethod).toEqual([
        { method: PaymentMethod.PIX, count: 3, amount: 600, net: 580 },
        { method: PaymentMethod.CREDIT_CARD, count: 2, amount: 400, net: 370 },
      ]);
    });

    it('should handle zero values when no payments exist', async () => {
      prisma.payment.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: null, fee: null, netAmount: null },
        _count: { id: 0 },
      });

      const result = await service.getStats(orgId);

      expect(result.totalConfirmed).toEqual({ count: 0, amount: 0, fees: 0, net: 0 });
      expect(result.byStatus).toEqual([]);
      expect(result.byMethod).toEqual([]);
    });
  });
});
