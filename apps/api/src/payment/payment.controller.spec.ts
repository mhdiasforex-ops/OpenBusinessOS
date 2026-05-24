import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentController } from './payment.controller';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    paymentService = {
      createConfig: vi.fn().mockResolvedValue({ id: 'cfg-1' }),
      getConfigs: vi.fn().mockResolvedValue([]),
      deleteConfig: vi.fn().mockResolvedValue({ success: true }),
      createPayment: vi.fn().mockResolvedValue({ id: 'pay-1' }),
      getPayments: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue({ total: 10 }),
      getPayment: vi.fn().mockResolvedValue({ id: 'pay-1' }),
      checkPaymentStatus: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'paid' }),
      cancelPayment: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'cancelled' }),
      refundPayment: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'refunded' }),
      processWebhook: vi.fn().mockResolvedValue({ received: true }),
    };
    controller = new PaymentController(paymentService);
  });

  it('should call createConfig with organizationId and dto', async () => {
    const dto = { provider: 'stripe', apiKey: 'sk_test_xxx' };
    const result = await controller.createConfig(req, dto);
    expect(paymentService.createConfig).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'cfg-1' });
  });

  it('should call getConfigs with organizationId', async () => {
    const result = await controller.getConfigs(req);
    expect(paymentService.getConfigs).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([]);
  });

  it('should call deleteConfig with organizationId and id', async () => {
    const result = await controller.deleteConfig(req, 'cfg-1');
    expect(paymentService.deleteConfig).toHaveBeenCalledWith('org-123', 'cfg-1');
    expect(result).toEqual({ success: true });
  });

  it('should call createPayment with organizationId and dto', async () => {
    const dto = { amount: 1000, currency: 'BRL' };
    const result = await controller.createPayment(req, dto);
    expect(paymentService.createPayment).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'pay-1' });
  });

  it('should call getPayments with organizationId and query', async () => {
    const query = { status: 'paid' };
    const result = await controller.getPayments(req, query);
    expect(paymentService.getPayments).toHaveBeenCalledWith('org-123', query);
    expect(result).toEqual([]);
  });

  it('should call getStats with organizationId', async () => {
    const result = await controller.getStats(req);
    expect(paymentService.getStats).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ total: 10 });
  });

  it('should call getPayment with organizationId and id', async () => {
    const result = await controller.getPayment(req, 'pay-1');
    expect(paymentService.getPayment).toHaveBeenCalledWith('org-123', 'pay-1');
    expect(result).toEqual({ id: 'pay-1' });
  });

  it('should call checkPaymentStatus with organizationId and id', async () => {
    const result = await controller.checkStatus(req, 'pay-1');
    expect(paymentService.checkPaymentStatus).toHaveBeenCalledWith('org-123', 'pay-1');
    expect(result).toEqual({ id: 'pay-1', status: 'paid' });
  });

  it('should call cancelPayment with organizationId and id', async () => {
    const result = await controller.cancelPayment(req, 'pay-1');
    expect(paymentService.cancelPayment).toHaveBeenCalledWith('org-123', 'pay-1');
    expect(result).toEqual({ id: 'pay-1', status: 'cancelled' });
  });

  it('should call refundPayment with organizationId and id', async () => {
    const result = await controller.refundPayment(req, 'pay-1');
    expect(paymentService.refundPayment).toHaveBeenCalledWith('org-123', 'pay-1');
    expect(result).toEqual({ id: 'pay-1', status: 'refunded' });
  });

  it('should call processWebhook with orgId, provider, and payload', async () => {
    const payload = { organizationId: 'org-123', event: 'payment.completed' };
    const result = await controller.webhook('stripe', payload, req);
    expect(paymentService.processWebhook).toHaveBeenCalledWith('org-123', 'stripe', payload);
    expect(result).toEqual({ received: true });
  });

  it('should return { received: true } when no orgId in webhook', async () => {
    const payload = {};
    const result = await controller.webhook('stripe', payload, { user: null });
    expect(result).toEqual({ received: true });
  });
});
