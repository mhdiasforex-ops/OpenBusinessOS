import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SegmentationService } from './segmentation.service';

describe('SegmentationService', () => {
  let service: SegmentationService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      customer: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new SegmentationService(prisma);
  });

  const orgId = 'org-123';

  describe('segmentCustomers', () => {
    it('should return empty result when there are no customers', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      const result = await service.segmentCustomers(orgId);

      expect(result).toEqual({
        segments: { VIP: 0, REGULAR: 0, NEW: 0, AT_RISK: 0, CHURNED: 0 },
        totalCustomers: 0,
        churnRiskCount: 0,
        churnRiskCustomerIds: [],
      });
      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it('should classify VIP: ltv > 10000 and last order within 30 days', async () => {
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const customers = [
        {
          id: 'cust-1',
          segment: 'NEW',
          ltv: 15000,
          totalOrders: 20,
          transactions: [{ paidAt: recentDate }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      expect(result.segments.VIP).toBe(1);
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: { segment: 'VIP' },
      });
    });

    it('should classify CHURNED: daysSinceLastOrder > 90', async () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      const customers = [
        {
          id: 'cust-1',
          segment: 'NEW',
          ltv: 500,
          totalOrders: 2,
          transactions: [{ paidAt: oldDate }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      expect(result.segments.CHURNED).toBe(1);
    });

    it('should classify AT_RISK: daysSinceLastOrder > 60 and <= 90', async () => {
      const riskDate = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000); // 75 days ago
      const customers = [
        {
          id: 'cust-risk',
          segment: 'NEW',
          ltv: 500,
          totalOrders: 2,
          transactions: [{ paidAt: riskDate }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      expect(result.segments.AT_RISK).toBe(1);
      expect(result.churnRiskCustomerIds).toContain('cust-risk');
      expect(result.churnRiskCount).toBe(1);
    });

    it('should classify REGULAR: totalOrders > 3 and not caught by above', async () => {
      const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const customers = [
        {
          id: 'cust-regular',
          segment: 'NEW',
          ltv: 500,
          totalOrders: 5,
          transactions: [{ paidAt: recentDate }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      expect(result.segments.REGULAR).toBe(1);
    });

    it('should classify NEW: fallback when no other condition matches', async () => {
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const customers = [
        {
          id: 'cust-new',
          segment: 'NEW',
          ltv: 100,
          totalOrders: 1,
          transactions: [{ paidAt: recentDate }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      expect(result.segments.NEW).toBe(1);
    });

    it('should not update customer when segment has not changed', async () => {
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const customers = [
        {
          id: 'cust-1',
          segment: 'VIP',
          ltv: 15000,
          totalOrders: 20,
          transactions: [{ paidAt: recentDate }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      await service.segmentCustomers(orgId);

      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it('should handle customers with no transactions (daysSinceLastOrder = 999)', async () => {
      const customers = [
        {
          id: 'cust-no-tx',
          segment: 'NEW',
          ltv: 100,
          totalOrders: 0,
          transactions: [],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      // 999 > 90 → CHURNED
      expect(result.segments.CHURNED).toBe(1);
    });

    it('should correctly count all segments with multiple customers', async () => {
      const now = new Date();
      const customers = [
        { id: 'c1', segment: 'NEW', ltv: 20000, totalOrders: 30, transactions: [{ paidAt: new Date(now.getTime() - 5 * 86400000) }] },    // VIP
        { id: 'c2', segment: 'VIP', ltv: 20000, totalOrders: 30, transactions: [{ paidAt: new Date(now.getTime() - 5 * 86400000) }] },    // VIP (no update)
        { id: 'c3', segment: 'NEW', ltv: 5000, totalOrders: 10, transactions: [{ paidAt: new Date(now.getTime() - 10 * 86400000) }] },   // REGULAR
        { id: 'c4', segment: 'NEW', ltv: 500, totalOrders: 2, transactions: [{ paidAt: new Date(now.getTime() - 75 * 86400000) }] },    // AT_RISK
        { id: 'c5', segment: 'NEW', ltv: 100, totalOrders: 1, transactions: [{ paidAt: new Date(now.getTime() - 100 * 86400000) }] },  // CHURNED
        { id: 'c6', segment: 'NEW', ltv: 50, totalOrders: 0, transactions: [{ paidAt: new Date(now.getTime() - 5 * 86400000) }] },     // NEW
      ];
      prisma.customer.findMany.mockResolvedValue(customers);
      prisma.customer.update.mockResolvedValue({});

      const result = await service.segmentCustomers(orgId);

      expect(result.totalCustomers).toBe(6);
      expect(result.segments.VIP).toBe(2);
      expect(result.segments.REGULAR).toBe(1);
      expect(result.segments.AT_RISK).toBe(1);
      expect(result.segments.CHURNED).toBe(1);
      expect(result.segments.NEW).toBe(1);
      expect(result.churnRiskCount).toBe(1);
      expect(result.churnRiskCustomerIds).toEqual(['c4']);
      // Only customers whose segment changed should be updated
      // c1: NEW→VIP, c3: NEW→REGULAR, c4: NEW→AT_RISK, c5: NEW→CHURNED = 4 updates
      // c2 already VIP (no change), c6 already NEW (no change)
      expect(prisma.customer.update).toHaveBeenCalledTimes(4);
    });
  });
});
