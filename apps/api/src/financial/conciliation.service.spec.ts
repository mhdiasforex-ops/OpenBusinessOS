import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConciliationService } from './conciliation.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { TransactionStatus } from '@prisma/client';

describe('ConciliationService', () => {
  let service: ConciliationService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new ConciliationService(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  const orgId = 'org-123';
  const userId = 'user-1';

  function makeTx(overrides: Partial<{
    id: string; organizationId: string; status: string;
    amount: number; auditTrail: any;
  }> = {}) {
    return {
      id: overrides.id ?? 'tx-1',
      organizationId: overrides.organizationId ?? orgId,
      status: overrides.status ?? 'PENDING',
      amount: overrides.amount ?? 1500,
      auditTrail: overrides.auditTrail ?? null,
    };
  }

  describe('conciliate', () => {
    it('should update transaction status to PAID with payment details', async () => {
      const tx = makeTx();
      prisma.transaction.findFirst.mockResolvedValue(tx);
      prisma.transaction.update.mockResolvedValue({ ...tx, status: 'PAID' });

      const result = await service.conciliate(orgId, {
        conciliationId: 'conc-001',
        items: [{ transactionId: 'tx-1', paidAt: '2026-06-25', paymentMethod: 'PIX' }],
      }, userId);

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'tx-1', organizationId: orgId },
      });
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: {
          status: TransactionStatus.PAID,
          paidAt: new Date('2026-06-25'),
          paymentMethod: 'PIX',
          conciliationId: 'conc-001',
          auditTrail: {
            conciliatedBy: userId,
            conciliatedAt: expect.any(String),
          },
        },
      });
      expect(result.results[0]).toEqual({ transactionId: 'tx-1', status: 'CONCILIATED' });
    });

    it('should merge with existing auditTrail', async () => {
      const tx = makeTx({ auditTrail: { prevNote: 'original data' } });
      prisma.transaction.findFirst.mockResolvedValue(tx);
      prisma.transaction.update.mockResolvedValue({});

      await service.conciliate(orgId, {
        conciliationId: 'conc-002',
        items: [{ transactionId: 'tx-1', paidAt: '2026-06-26', paymentMethod: 'CREDIT_CARD' }],
      }, userId);

      const updateCall = prisma.transaction.update.mock.calls[0][0];
      expect(updateCall.data.auditTrail.prevNote).toBe('original data');
      expect(updateCall.data.auditTrail.conciliatedBy).toBe(userId);
    });

    it('should include bankReference in auditTrail when provided', async () => {
      const tx = makeTx();
      prisma.transaction.findFirst.mockResolvedValue(tx);
      prisma.transaction.update.mockResolvedValue({});

      await service.conciliate(orgId, {
        conciliationId: 'conc-003',
        items: [{ transactionId: 'tx-1', paidAt: '2026-06-27', paymentMethod: 'BANK_TRANSFER', bankReference: 'REF-123' }],
      }, userId);

      const updateCall = prisma.transaction.update.mock.calls[0][0];
      expect(updateCall.data.auditTrail.bankReference).toBe('REF-123');
    });

    it('should return NOT_FOUND for non-existent transactions', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      const result = await service.conciliate(orgId, {
        conciliationId: 'conc-004',
        items: [{ transactionId: 'tx-missing', paidAt: '2026-06-25', paymentMethod: 'PIX' }],
      }, userId);

      expect(prisma.transaction.update).not.toHaveBeenCalled();
      expect(result.results[0]).toEqual({ transactionId: 'tx-missing', status: 'NOT_FOUND' });
    });

    it('should handle mix of found and not-found items', async () => {
      prisma.transaction.findFirst
        .mockResolvedValueOnce(makeTx({ id: 'tx-found' }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeTx({ id: 'tx-found2' }));
      prisma.transaction.update.mockResolvedValue({});

      const result = await service.conciliate(orgId, {
        conciliationId: 'conc-005',
        items: [
          { transactionId: 'tx-found', paidAt: '2026-06-25', paymentMethod: 'PIX' },
          { transactionId: 'tx-missing', paidAt: '2026-06-25', paymentMethod: 'BANK_SLIP' },
          { transactionId: 'tx-found2', paidAt: '2026-06-26', paymentMethod: 'CASH' },
        ],
      }, userId);

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({ transactionId: 'tx-found', status: 'CONCILIATED' });
      expect(result.results[1]).toEqual({ transactionId: 'tx-missing', status: 'NOT_FOUND' });
      expect(result.results[2]).toEqual({ transactionId: 'tx-found2', status: 'CONCILIATED' });
      expect(prisma.transaction.update).toHaveBeenCalledTimes(2);
    });

    it('should return conciliationId in result', async () => {
      prisma.transaction.findFirst.mockResolvedValue(makeTx());
      prisma.transaction.update.mockResolvedValue({});

      const result = await service.conciliate(orgId, {
        conciliationId: 'conc-006',
        items: [{ transactionId: 'tx-1', paidAt: '2026-06-25', paymentMethod: 'DEBIT_CARD' }],
      }, userId);

      expect(result.conciliationId).toBe('conc-006');
    });

    it('should handle empty items array', async () => {
      const result = await service.conciliate(orgId, {
        conciliationId: 'conc-empty',
        items: [],
      }, userId);

      expect(result.results).toHaveLength(0);
      expect(prisma.transaction.findFirst).not.toHaveBeenCalled();
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('should verify transaction belongs to the same org', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await service.conciliate(orgId, {
        conciliationId: 'conc-007',
        items: [{ transactionId: 'tx-wrong-org', paidAt: '2026-06-25', paymentMethod: 'PIX' }],
      }, userId);

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'tx-wrong-org', organizationId: orgId },
      });
    });

    it('should handle transactions with null auditTrail', async () => {
      const tx = makeTx({ auditTrail: null });
      prisma.transaction.findFirst.mockResolvedValue(tx);
      prisma.transaction.update.mockResolvedValue({});

      await service.conciliate(orgId, {
        conciliationId: 'conc-008',
        items: [{ transactionId: 'tx-1', paidAt: '2026-06-25', paymentMethod: 'PIX' }],
      }, userId);

      const updateCall = prisma.transaction.update.mock.calls[0][0];
      expect(updateCall.data.auditTrail.conciliatedBy).toBe(userId);
    });

    it('should handle multiple items with same transaction gracefully', async () => {
      prisma.transaction.findFirst
        .mockResolvedValueOnce(makeTx({ id: 'tx-dup' }))
        .mockResolvedValueOnce(makeTx({ id: 'tx-dup' }));
      prisma.transaction.update.mockResolvedValue({});

      const result = await service.conciliate(orgId, {
        conciliationId: 'conc-dup',
        items: [
          { transactionId: 'tx-dup', paidAt: '2026-06-25', paymentMethod: 'PIX' },
          { transactionId: 'tx-dup', paidAt: '2026-06-26', paymentMethod: 'BANK_SLIP' },
        ],
      }, userId);

      expect(result.results).toHaveLength(2);
      expect(result.results.every((r) => r.status === 'CONCILIATED')).toBe(true);
      expect(prisma.transaction.update).toHaveBeenCalledTimes(2);
    });
  });
});
