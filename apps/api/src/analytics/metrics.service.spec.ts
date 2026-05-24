import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        aggregate: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      customer: {
        count: vi.fn(),
      },
      product: {
        count: vi.fn(),
      },
    };
    service = new MetricsService(prisma);
  });

  const orgId = 'org-123';

  describe('getMetrics', () => {
    it('should calculate metrics correctly with all values', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })  // income this month
        .mockResolvedValueOnce({ _sum: { amount: 4000 } });  // expense this month
      prisma.customer.count.mockResolvedValue(50);
      prisma.product.count.mockResolvedValue(100);
      prisma.transaction.count
        .mockResolvedValueOnce(5)   // overdue count
        .mockResolvedValueOnce(500); // total transactions

      const result = await service.getMetrics(orgId);

      expect(result).toEqual({
        income: 10000,
        expense: 4000,
        profit: 6000,
        activeCustomers: 50,
        totalProducts: 100,
        totalTransactions: 500,
        averageMargin: 60,
        overdueCount: 5,
      });
    });

    it('should handle zero income gracefully', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 } });
      prisma.customer.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.transaction.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getMetrics(orgId);

      expect(result.income).toBe(0);
      expect(result.expense).toBe(500);
      expect(result.profit).toBe(-500);
      expect(result.averageMargin).toBe(0);
    });

    it('should handle null aggregate amounts', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });
      prisma.customer.count.mockResolvedValue(10);
      prisma.product.count.mockResolvedValue(5);
      prisma.transaction.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(20);

      const result = await service.getMetrics(orgId);

      expect(result.income).toBe(0);
      expect(result.expense).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.averageMargin).toBe(0);
    });

    it('should calculate averageMargin with only income', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 2000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });
      prisma.customer.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.transaction.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getMetrics(orgId);

      expect(result.averageMargin).toBe(100);
    });

    it('should round averageMargin to 2 decimal places', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000 } })
        .mockResolvedValueOnce({ _sum: { amount: 333 } });
      prisma.customer.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.transaction.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getMetrics(orgId);

      expect(result.averageMargin).toBe(66.7);
    });

    it('should pass orgId to all prisma queries', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });
      prisma.customer.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.transaction.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getMetrics(orgId);

      expect(prisma.customer.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: orgId }) }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: orgId }) }),
      );
      expect(prisma.transaction.aggregate).toHaveBeenCalledTimes(2);
      expect(prisma.transaction.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRevenueTimeSeries', () => {
    it('should return series for default 12 months', async () => {
      prisma.transaction.aggregate
        .mockResolvedValue({ _sum: { amount: 1000 } });

      const result = await service.getRevenueTimeSeries(orgId);

      expect(result).toHaveLength(12);
      result.forEach((point: any) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('income', 1000);
        expect(point).toHaveProperty('expense', 1000);
        expect(point).toHaveProperty('profit', 0);
      });
    });

    it('should return series for custom number of months', async () => {
      prisma.transaction.aggregate
        .mockResolvedValue({ _sum: { amount: 500 } });

      const result = await service.getRevenueTimeSeries(orgId, 3);

      expect(result).toHaveLength(3);
      result.forEach((point: any) => {
        expect(point.income).toBe(500);
        expect(point.expense).toBe(500);
      });
    });

    it('should handle zero and null aggregate amounts', async () => {
      prisma.transaction.aggregate
        .mockResolvedValue({ _sum: { amount: null } });

      const result = await service.getRevenueTimeSeries(orgId, 1);

      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(0);
      expect(result[0].expense).toBe(0);
      expect(result[0].profit).toBe(0);
    });

    it('should calculate profit correctly', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 3000 } })
        .mockResolvedValueOnce({ _sum: { amount: 1000 } });

      const result = await service.getRevenueTimeSeries(orgId, 1);

      expect(result[0].profit).toBe(2000);
    });

    it('should use correct date labels in YYYY-MM format', async () => {
      prisma.transaction.aggregate
        .mockResolvedValue({ _sum: { amount: 0 } });

      const result = await service.getRevenueTimeSeries(orgId, 2);

      expect(result[0]).toHaveProperty('date');
      expect(result[1]).toHaveProperty('date');
      expect(result[0].date).toMatch(/^\d{4}-\d{2}$/);
      expect(result[1].date).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('getCategoryBreakdown', () => {
    const baseDate = new Date();

    it('should return categories sorted by value descending', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { category: 'Vendas', amount: 8000 },
        { category: 'Servicos', amount: 2000 },
        { category: 'Produtos', amount: 5000 },
      ]);

      const result = await service.getCategoryBreakdown(orgId, 'INCOME', 3);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Vendas');
      expect(result[1].name).toBe('Produtos');
      expect(result[2].name).toBe('Servicos');
    });

    it('should calculate percentages correctly', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { category: 'A', amount: 7500 },
        { category: 'B', amount: 2500 },
      ]);

      const result = await service.getCategoryBreakdown(orgId, 'INCOME', 3);

      expect(result[0].percentage).toBe(75);
      expect(result[1].percentage).toBe(25);
    });

    it('should handle single category', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { category: 'Vendas', amount: 5000 },
        { category: 'Vendas', amount: 3000 },
      ]);

      const result = await service.getCategoryBreakdown(orgId, 'INCOME', 3);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(8000);
      expect(result[0].percentage).toBe(100);
    });

    it('should return empty array when no transactions found', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.getCategoryBreakdown(orgId, 'EXPENSE', 3);

      expect(result).toEqual([]);
    });

    it('should round percentages to 2 decimal places', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        { category: 'A', amount: 3333 },
        { category: 'B', amount: 3333 },
        { category: 'C', amount: 3334 },
      ]);

      const result = await service.getCategoryBreakdown(orgId, 'INCOME', 3);

      const total = result.reduce((sum: number, r: any) => sum + r.percentage, 0);
      expect(total).toBe(100);
    });

    it('should pass the correct type filter to prisma', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.getCategoryBreakdown(orgId, 'EXPENSE', 1);

      const callArgs = prisma.transaction.findMany.mock.calls[0][0];
      expect(callArgs.where.type).toBe('EXPENSE');
      expect(callArgs.where.organizationId).toBe(orgId);
      expect(callArgs.where.status).toBe('PAID');
      expect(callArgs.where.paidAt).toHaveProperty('gte');
    });
  });
});
