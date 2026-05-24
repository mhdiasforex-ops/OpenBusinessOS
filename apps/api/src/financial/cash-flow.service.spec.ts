import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashFlowService } from './cash-flow.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CashFlowService', () => {
  let service: CashFlowService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
      },
    };
    service = new CashFlowService(prisma as unknown as PrismaService);
  });

  const orgId = 'org-123';
  const baseQuery = { startDate: '2026-01-01', endDate: '2026-01-31' };

  function makeTx(overrides: Partial<{
    id: string; type: string; amount: number; dueDate: string; status: string;
  }> = {}) {
    return {
      id: overrides.id ?? 'tx-1',
      type: overrides.type ?? 'INCOME',
      amount: overrides.amount ?? 1000,
      dueDate: new Date(overrides.dueDate ?? '2026-01-15'),
      status: overrides.status ?? 'PAID',
    };
  }

  describe('getCashFlow', () => {
    it('should query transactions in date range with PAID or PENDING status', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      await service.getCashFlow(orgId, baseQuery);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          dueDate: { gte: new Date('2026-01-01'), lte: new Date('2026-01-31') },
          status: { in: ['PAID', 'PENDING'] },
        },
        orderBy: { dueDate: 'asc' },
      });
    });

    it('should group transactions by date and calculate daily balance', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ dueDate: '2026-01-01', type: 'INCOME', amount: 500 }),
        makeTx({ dueDate: '2026-01-02', type: 'EXPENSE', amount: 200 }),
        makeTx({ dueDate: '2026-01-02', type: 'INCOME', amount: 300 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({ date: '2026-01-01', inflow: 500, outflow: 0, balance: 500 });
      expect(result.entries[1]).toEqual({ date: '2026-01-02', inflow: 300, outflow: 200, balance: 600 });
    });

    it('should compute correct summary totals', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ dueDate: '2026-01-05', type: 'INCOME', amount: 2000 }),
        makeTx({ dueDate: '2026-01-10', type: 'EXPENSE', amount: 500 }),
        makeTx({ dueDate: '2026-01-20', type: 'INCOME', amount: 1500 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.summary).toEqual({
        totalInflow: 3500,
        totalOutflow: 500,
        netFlow: 3000,
        finalBalance: 3000,
      });
    });

    it('should return period boundaries from query', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.period).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' });
    });

    it('should handle no transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries).toHaveLength(0);
      expect(result.summary).toEqual({
        totalInflow: 0, totalOutflow: 0, netFlow: 0, finalBalance: 0,
      });
    });

    it('should handle only income transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ dueDate: '2026-01-01', type: 'INCOME', amount: 100 }),
        makeTx({ dueDate: '2026-01-02', type: 'INCOME', amount: 200 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries.every((e) => e.outflow === 0)).toBe(true);
      expect(result.summary.totalInflow).toBe(300);
      expect(result.summary.totalOutflow).toBe(0);
    });

    it('should handle only expense transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ dueDate: '2026-01-01', type: 'EXPENSE', amount: 100 }),
        makeTx({ dueDate: '2026-01-02', type: 'EXPENSE', amount: 200 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries.every((e) => e.inflow === 0)).toBe(true);
      expect(result.summary.totalInflow).toBe(0);
      expect(result.summary.totalOutflow).toBe(300);
      expect(result.summary.finalBalance).toBe(-300);
    });

    it('should accumulate balance across sequential days', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ dueDate: '2026-01-01', type: 'INCOME', amount: 1000 }),
        makeTx({ dueDate: '2026-01-02', type: 'EXPENSE', amount: 400 }),
        makeTx({ dueDate: '2026-01-03', type: 'INCOME', amount: 200 }),
        makeTx({ dueDate: '2026-01-04', type: 'EXPENSE', amount: 100 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries[0].balance).toBe(1000);
      expect(result.entries[1].balance).toBe(600);
      expect(result.entries[2].balance).toBe(800);
      expect(result.entries[3].balance).toBe(700);
      expect(result.summary.finalBalance).toBe(700);
    });

    it('should sort entries chronologically', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ dueDate: '2026-01-10', type: 'INCOME', amount: 100 }),
        makeTx({ dueDate: '2026-01-01', type: 'EXPENSE', amount: 200 }),
        makeTx({ dueDate: '2026-01-05', type: 'INCOME', amount: 300 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries.map((e) => e.date)).toEqual(['2026-01-01', '2026-01-05', '2026-01-10']);
    });

    it('should aggregate multiple transactions on the same date', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ id: 'tx-1', dueDate: '2026-01-15', type: 'INCOME', amount: 500 }),
        makeTx({ id: 'tx-2', dueDate: '2026-01-15', type: 'INCOME', amount: 300 }),
        makeTx({ id: 'tx-3', dueDate: '2026-01-15', type: 'EXPENSE', amount: 200 }),
      ]);
      const result = await service.getCashFlow(orgId, baseQuery);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({
        date: '2026-01-15', inflow: 800, outflow: 200, balance: 600,
      });
    });
  });

  describe('getCashFlowByMonths', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should call getCashFlow with default 3-month range', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      vi.spyOn(service, 'getCashFlow').mockResolvedValue({
        period: { startDate: '2026-03-15', endDate: '2026-06-15' },
        entries: [],
        summary: { totalInflow: 0, totalOutflow: 0, netFlow: 0, finalBalance: 0 },
      });
      const result = await service.getCashFlowByMonths(orgId);
      expect(service.getCashFlow).toHaveBeenCalledWith(orgId, {
        startDate: '2026-03-15',
        endDate: '2026-06-15',
      });
    });

    it('should use custom months parameter', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      vi.spyOn(service, 'getCashFlow').mockResolvedValue({
        period: { startDate: '2026-03-15', endDate: '2026-05-15' },
        entries: [],
        summary: { totalInflow: 0, totalOutflow: 0, netFlow: 0, finalBalance: 0 },
      });
      const result = await service.getCashFlowByMonths(orgId, 2);
      expect(service.getCashFlow).toHaveBeenCalledWith(orgId, {
        startDate: '2026-03-15',
        endDate: '2026-05-15',
      });
    });

    it('should return the result from getCashFlow', async () => {
      const fakeResult = {
        period: { startDate: '2026-03-15', endDate: '2026-06-15' },
        entries: [{ date: '2026-03-20', inflow: 500, outflow: 0, balance: 500 }],
        summary: { totalInflow: 500, totalOutflow: 0, netFlow: 500, finalBalance: 500 },
      };
      vi.spyOn(service, 'getCashFlow').mockResolvedValue(fakeResult);
      const result = await service.getCashFlowByMonths(orgId);
      expect(result).toEqual(fakeResult);
    });
  });
});
