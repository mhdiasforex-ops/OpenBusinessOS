import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsaasProvider } from './asaas.provider';
import { PaymentMethod, PaymentStatus } from '../payment.dto';

vi.mock('axios');

describe('AsaasProvider', () => {
  let provider: AsaasProvider;

  beforeEach(() => {
    provider = new AsaasProvider();
  });

  describe('createCharge', () => {
    it('should return payment data for PIX method', async () => {
      const result = await provider.createCharge({ amount: 100, method: PaymentMethod.PIX });
      expect(result.externalId).toMatch(/^asaas_stub_/);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.pixCode).toBeDefined();
      expect(result.pixQrCode).toBeDefined();
      expect(result.fee).toBe(0);
      expect(result.netAmount).toBe(100);
    });

    it('should return payment data for BANK_SLIP method', async () => {
      const result = await provider.createCharge({ amount: 100, method: PaymentMethod.BANK_SLIP });
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.boletoUrl).toBeDefined();
      expect(result.boletoBarCode).toBeDefined();
      expect(result.fee).toBeCloseTo(3.99);
      expect(result.netAmount).toBeCloseTo(96.01);
    });

    it('should return payment data for CREDIT_CARD method', async () => {
      const result = await provider.createCharge({ amount: 200, method: PaymentMethod.CREDIT_CARD });
      expect(result.fee).toBeCloseTo(7.98);
      expect(result.netAmount).toBeCloseTo(192.02);
    });
  });

  describe('checkStatus', () => {
    it('should return pending status for external id', async () => {
      const result = await provider.checkStatus('ext-123');
      expect(result.externalId).toBe('ext-123');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('cancelCharge', () => {
    it('should return cancelled status', async () => {
      const result = await provider.cancelCharge('ext-123');
      expect(result.externalId).toBe('ext-123');
      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });
  });

  describe('refundCharge', () => {
    it('should return refunded status', async () => {
      const result = await provider.refundCharge('ext-123');
      expect(result.externalId).toBe('ext-123');
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('processWebhook', () => {
    it('should process webhook payload with payment data', async () => {
      const payload = { event: 'payment.confirmed', payment: { id: 'ext-456', confirmedDate: '2026-05-24' } };
      const result = await provider.processWebhook(payload);
      expect(result.externalId).toBe('ext-456');
      expect(result.status).toBe(PaymentStatus.CONFIRMED);
      expect(result.paidAt).toBeInstanceOf(Date);
    });

    it('should return unknown when payment id is missing', async () => {
      const result = await provider.processWebhook({ event: 'payment.created' });
      expect(result.externalId).toBe('unknown');
    });
  });
});
