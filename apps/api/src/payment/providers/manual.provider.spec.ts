import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManualProvider } from './manual.provider';
import { PaymentMethod, PaymentStatus } from '../payment.dto';

vi.mock('axios');

describe('ManualProvider', () => {
  let provider: ManualProvider;

  beforeEach(() => {
    provider = new ManualProvider();
  });

  describe('createCharge', () => {
    it('should return manual payment data with zero fee', async () => {
      const result = await provider.createCharge({ amount: 500, method: PaymentMethod.CASH });
      expect(result.externalId).toMatch(/^manual-/);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.fee).toBe(0);
      expect(result.netAmount).toBe(500);
    });
  });

  describe('checkStatus', () => {
    it('should return pending status', async () => {
      const result = await provider.checkStatus('manual-1');
      expect(result.externalId).toBe('manual-1');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('cancelCharge', () => {
    it('should return cancelled status', async () => {
      const result = await provider.cancelCharge('manual-1');
      expect(result.externalId).toBe('manual-1');
      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });
  });

  describe('refundCharge', () => {
    it('should return refunded status', async () => {
      const result = await provider.refundCharge('manual-1');
      expect(result.externalId).toBe('manual-1');
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('processWebhook', () => {
    it('should process webhook payload extracting externalId', async () => {
      const result = await provider.processWebhook({ externalId: 'manual-ext-1' });
      expect(result.externalId).toBe('manual-ext-1');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should return unknown when externalId is missing', async () => {
      const result = await provider.processWebhook({});
      expect(result.externalId).toBe('unknown');
    });
  });
});
