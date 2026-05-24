import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MercadoPagoProvider } from './mercado-pago.provider';
import { PaymentMethod, PaymentStatus } from '../payment.dto';

vi.mock('axios');

describe('MercadoPagoProvider', () => {
  let provider: MercadoPagoProvider;

  beforeEach(() => {
    provider = new MercadoPagoProvider();
  });

  describe('createCharge', () => {
    it('should return payment data for PIX method with 0.99 fee', async () => {
      const result = await provider.createCharge({ amount: 100, method: PaymentMethod.PIX });
      expect(result.externalId).toMatch(/^mp_stub_/);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.pixCode).toBeDefined();
      expect(result.pixQrCode).toBeDefined();
      expect(result.fee).toBe(0.99);
      expect(result.netAmount).toBe(99.01);
    });

    it('should return payment data for BANK_SLIP method', async () => {
      const result = await provider.createCharge({ amount: 200, method: PaymentMethod.BANK_SLIP });
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.boletoUrl).toBeDefined();
      expect(result.boletoBarCode).toBeDefined();
      expect(result.fee).toBeCloseTo(7.98);
      expect(result.netAmount).toBeCloseTo(192.02);
    });
  });

  describe('checkStatus', () => {
    it('should return pending status', async () => {
      const result = await provider.checkStatus('ext-mp-1');
      expect(result.externalId).toBe('ext-mp-1');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('cancelCharge', () => {
    it('should return cancelled status', async () => {
      const result = await provider.cancelCharge('ext-mp-1');
      expect(result.externalId).toBe('ext-mp-1');
      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });
  });

  describe('refundCharge', () => {
    it('should return refunded status', async () => {
      const result = await provider.refundCharge('ext-mp-1');
      expect(result.externalId).toBe('ext-mp-1');
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('processWebhook', () => {
    it('should process webhook payload', async () => {
      const payload = { action: 'payment.created', data: { id: 'mp-123' } };
      const result = await provider.processWebhook(payload);
      expect(result.externalId).toBe('mp-123');
      expect(result.status).toBe(PaymentStatus.CONFIRMED);
      expect(result.paidAt).toBeInstanceOf(Date);
    });

    it('should return unknown when data.id is missing', async () => {
      const result = await provider.processWebhook({ action: 'payment.created' });
      expect(result.externalId).toBe('unknown');
    });
  });
});
