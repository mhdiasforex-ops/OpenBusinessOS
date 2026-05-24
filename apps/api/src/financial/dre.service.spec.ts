import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DreService } from './dre.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DreService', () => {
  let service: DreService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
      },
    };
    service = new DreService(prisma as unknown as PrismaService);
  });

  const orgId = 'org-123';

  function makeTx(overrides: Partial<{
    id: string; type: string; amount: number; dueDate: Date;
    status: string; category: string;
  }> = {}) {
    return {
      id: overrides.id ?? 'tx-1',
      type: overrides.type ?? 'INCOME',
      amount: overrides.amount ?? 10000,
      dueDate: overrides.dueDate ?? new Date('2026-01-15'),
      status: overrides.status ?? 'PAID',
      category: overrides.category ?? 'Vendas',
    };
  }

  describe('generateDRE', () => {
    it('should query PAID transactions within the given month', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      await service.generateDRE(orgId, 1, 2026);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          dueDate: {
            gte: new Date(2026, 0, 1),
            lte: new Date(2026, 1, 0, 23, 59, 59),
          },
          status: 'PAID',
        },
      });
    });

    it('should split income and expenses correctly', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ id: 'tx-1', type: 'INCOME', amount: 10000, category: 'Vendas' }),
        makeTx({ id: 'tx-2', type: 'EXPENSE', amount: 3000, category: 'Aluguel' }),
        makeTx({ id: 'tx-3', type: 'EXPENSE', amount: 2000, category: 'Salários' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.grossRevenue).toBe(10000);
    });

    it('should use Custo category for COGS', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 4000, category: 'Custo' }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'Aluguel' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.cogs).toBe(4000);
      expect(result.netRevenue).toBe(6000);
    });

    it('should fallback to CMV category if Custo not present', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 3500, category: 'CMV' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.cogs).toBe(3500);
    });

    it('should default COGS to 0 if no Custo/CMV category', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 5000, category: 'Operacional' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.cogs).toBe(0);
      expect(result.netRevenue).toBe(10000);
    });

    it('should exclude Custo and CMV from operating expenses', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 3000, category: 'Custo' }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'CMV' }),
        makeTx({ type: 'EXPENSE', amount: 1500, category: 'Aluguel' }),
        makeTx({ type: 'EXPENSE', amount: 2500, category: 'Salários' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      const opCats = result.operatingExpenses.map((e) => e.name);
      expect(opCats).not.toContain('Custo');
      expect(opCats).not.toContain('CMV');
      expect(opCats).toContain('Aluguel');
      expect(opCats).toContain('Salários');
      expect(result.operatingTotal).toBe(4000);
    });

    it('should calculate gross margin percentage correctly', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 3000, category: 'Custo' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.grossMargin).toBe(70);
    });

    it('should calculate ebitda = netRevenue - operatingTotal', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'Custo' }),
        makeTx({ type: 'EXPENSE', amount: 1000, category: 'Aluguel' }),
        makeTx({ type: 'EXPENSE', amount: 500, category: 'Marketing' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.netRevenue).toBe(8000);
      expect(result.operatingTotal).toBe(1500);
      expect(result.ebitda).toBe(6500);
    });

    it('should calculate netIncome = grossRevenue - totalExpenses', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 3000, category: 'Custo' }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'Aluguel' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.netIncome).toBe(5000);
    });

    it('should calculate netMargin percentage', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 3000, category: 'Custo' }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'Operacional' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.netMargin).toBe(50);
    });

    it('should format period string as YYYY-MM', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.period).toBe('2026-01');
    });

    it('should pad single-digit months with leading zero', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.generateDRE(orgId, 3, 2026);
      expect(result.period).toBe('2026-03');
    });

    it('should handle empty transactions for the period', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.grossRevenue).toBe(0);
      expect(result.cogs).toBe(0);
      expect(result.operatingTotal).toBe(0);
      expect(result.ebitda).toBe(0);
      expect(result.netIncome).toBe(0);
      expect(result.netMargin).toBe(0);
    });

    it('should handle zero grossRevenue (division by zero guards)', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'EXPENSE', amount: 1000, category: 'Aluguel' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.grossRevenue).toBe(0);
      expect(result.grossMargin).toBe(0);
      expect(result.netMargin).toBe(0);
    });

    it('should compute operating expense percentages relative to total expenses', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 10000 }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'Aluguel' }),
        makeTx({ type: 'EXPENSE', amount: 2000, category: 'Marketing' }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.operatingExpenses).toHaveLength(2);
      expect(result.operatingExpenses[0].percentage).toBe(50);
      expect(result.operatingExpenses[1].percentage).toBe(50);
    });

    it('should handle zero total expenses in percentage calc', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ type: 'INCOME', amount: 5000 }),
      ]);
      const result = await service.generateDRE(orgId, 1, 2026);
      expect(result.operatingExpenses).toHaveLength(0);
      expect(result.operatingTotal).toBe(0);
    });
  });

  describe('getDREComparison', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-20T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should call generateDRE for each of the last N months', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const spy = vi.spyOn(service, 'generateDRE');
      spy.mockResolvedValue({
        period: '', grossRevenue: 0, cogs: 0, netRevenue: 0,
        grossMargin: 0, operatingExpenses: [], operatingTotal: 0,
        ebitda: 0, netIncome: 0, netMargin: 0,
      });
      await service.getDREComparison(orgId, 3);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenNthCalledWith(1, orgId, 3, 2026);
      expect(spy).toHaveBeenNthCalledWith(2, orgId, 2, 2026);
      expect(spy).toHaveBeenNthCalledWith(3, orgId, 1, 2026);
    });

    it('should return results in chronological order', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      vi.spyOn(service, 'generateDRE').mockImplementation(async (_org, month, _year) => ({
        period: `${_year}-${String(month).padStart(2, '0')}`,
        grossRevenue: month * 1000, cogs: 0, netRevenue: month * 1000,
        grossMargin: 100, operatingExpenses: [], operatingTotal: 0,
        ebitda: month * 1000, netIncome: month * 1000, netMargin: 100,
      }));
      const result = await service.getDREComparison(orgId, 3);
      expect(result).toHaveLength(3);
      expect(result[0].period).toBe('2026-01');
      expect(result[1].period).toBe('2026-02');
      expect(result[2].period).toBe('2026-03');
    });

    it('should use default months = 3', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const spy = vi.spyOn(service, 'generateDRE');
      spy.mockResolvedValue({
        period: '', grossRevenue: 0, cogs: 0, netRevenue: 0,
        grossMargin: 0, operatingExpenses: [], operatingTotal: 0,
        ebitda: 0, netIncome: 0, netMargin: 0,
      });
      await service.getDREComparison(orgId);
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle edge months across year boundary', async () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
      prisma.transaction.findMany.mockResolvedValue([]);
      const spy = vi.spyOn(service, 'generateDRE');
      spy.mockResolvedValue({
        period: '', grossRevenue: 0, cogs: 0, netRevenue: 0,
        grossMargin: 0, operatingExpenses: [], operatingTotal: 0,
        ebitda: 0, netIncome: 0, netMargin: 0,
      });
      await service.getDREComparison(orgId, 2);
      expect(spy).toHaveBeenNthCalledWith(1, orgId, 1, 2026);
      expect(spy).toHaveBeenNthCalledWith(2, orgId, 12, 2025);
    });

    it('should handle single month comparison', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const spy = vi.spyOn(service, 'generateDRE');
      spy.mockResolvedValue({
        period: '2026-03', grossRevenue: 5000, cogs: 0, netRevenue: 5000,
        grossMargin: 100, operatingExpenses: [], operatingTotal: 0,
        ebitda: 5000, netIncome: 5000, netMargin: 100,
      });
      const result = await service.getDREComparison(orgId, 1);
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2026-03');
    });
  });
});
