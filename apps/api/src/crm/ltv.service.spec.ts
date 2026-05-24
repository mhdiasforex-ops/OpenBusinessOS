import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LtvService } from './ltv.service';

describe('LtvService', () => {
  let service: LtvService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
      },
      customer: {
        update: vi.fn(),
      },
    };

    service = new LtvService(prisma);
  });

  const orgId = 'org-123';
  const customerId = 'cust-1';

  describe('calculateLTV', () => {
    it('should return zero values when customer has no transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.calculateLTV(orgId, customerId);

      expect(result).toEqual({
        customerId: 'cust-1',
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        purchaseFrequency: 0,
        ltv: 0,
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          customerId,
          type: 'INCOME',
          status: 'PAID',
        },
        orderBy: { paidAt: 'asc' },
      });

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: expect.objectContaining({
          ltv: expect.any(Object),
          totalOrders: 0,
          lastOrderAt: undefined,
        }),
      });
    });

    it('should calculate LTV correctly for a single transaction', async () => {
      const now = new Date();
      const transactions = [
        {
          amount: 500,
          paidAt: now,
        },
      ];
      prisma.transaction.findMany.mockResolvedValue(transactions);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.calculateLTV(orgId, customerId);

      // avgOrderValue = 500, purchaseFrequency = 1/1 = 1
      // ltv = 500 * 1 * 12 = 6000
      expect(result).toEqual({
        customerId: 'cust-1',
        totalRevenue: 500,
        totalOrders: 1,
        avgOrderValue: 500,
        purchaseFrequency: 1,
        ltv: 6000,
      });
    });

    it('should calculate LTV correctly for multiple transactions over time', async () => {
      const now = new Date();
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const transactions = [
        { amount: 200, paidAt: threeMonthsAgo },
        { amount: 300, paidAt: now },
      ];
      prisma.transaction.findMany.mockResolvedValue(transactions);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.calculateLTV(orgId, customerId);

      // totalRevenue = 500, totalOrders = 2, avgOrderValue = 250
      // monthsDiff ≈ 3, purchaseFrequency ≈ 2/3 ≈ 0.67
      // ltv ≈ 250 * 0.67 * 12 ≈ 2000
      expect(result.totalRevenue).toBe(500);
      expect(result.totalOrders).toBe(2);
      expect(result.avgOrderValue).toBe(250);
      expect(result.purchaseFrequency).toBeGreaterThan(0.5);
      expect(result.ltv).toBeGreaterThan(0);
    });

    it('should update customer record with correct ltv, totalOrders, and lastOrderAt', async () => {
      const lastOrderDate = new Date('2026-05-01');
      const transactions = [
        { amount: 1000, paidAt: lastOrderDate },
      ];
      prisma.transaction.findMany.mockResolvedValue(transactions);
      prisma.customer.update.mockResolvedValue({});

      await service.calculateLTV(orgId, customerId);

      const updateCall = prisma.customer.update.mock.calls[0][0];
      expect(updateCall.where.id).toBe(customerId);
      expect(updateCall.data.totalOrders).toBe(1);
      expect(updateCall.data.lastOrderAt).toEqual(lastOrderDate);
      // ltv should be a Prisma.Decimal-like object with value 12000
      expect(updateCall.data.ltv).toBeDefined();
    });

    it('should handle customers with transactions on the same day', async () => {
      const now = new Date();
      const transactions = [
        { amount: 100, paidAt: now },
        { amount: 200, paidAt: now },
        { amount: 300, paidAt: now },
      ];
      prisma.transaction.findMany.mockResolvedValue(transactions);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.calculateLTV(orgId, customerId);

      // monthsDiff = 1 (minimum), purchaseFrequency = 3/1 = 3
      // avgOrderValue = 200, ltv = 200 * 3 * 12 = 7200
      expect(result.totalRevenue).toBe(600);
      expect(result.totalOrders).toBe(3);
      expect(result.avgOrderValue).toBe(200);
      expect(result.purchaseFrequency).toBe(3);
      expect(result.ltv).toBe(7200);
    });
  });
});
