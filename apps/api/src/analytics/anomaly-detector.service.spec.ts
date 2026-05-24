import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectorService } from './anomaly-detector.service';

vi.mock('@openbusinessos/event-definitions', () => ({
  EventTypes: { ANOMALY_DETECTED: 'ANOMALY_DETECTED' },
  AnomalyDetectedPayload: {},
}));

describe('AnomalyDetectorService', () => {
  let service: AnomalyDetectorService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      transaction: { aggregate: vi.fn() },
      product: { findMany: vi.fn() },
      customer: { findMany: vi.fn() },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new AnomalyDetectorService(prisma, eventBus);
  });

  const orgId = 'org-123';

  describe('detectAnomalies', () => {
    it('should return all anomalies when all detectors trigger', async () => {
      const expenseAnomaly = { type: 'EXPENSE_ABOVE_THRESHOLD', severity: 'HIGH' };
      const revenueAnomaly = { type: 'REVENUE_DROP', severity: 'MEDIUM' };
      const stockAnomaly = { type: 'ZERO_STOCK_ACTIVE_PRODUCTS', severity: 'LOW' };
      const vipAnomaly = { type: 'VIP_WITHOUT_ORDER', severity: 'LOW' };

      vi.spyOn(service as any, 'detectExpenseAnomaly').mockResolvedValue(expenseAnomaly);
      vi.spyOn(service as any, 'detectRevenueDropAnomaly').mockResolvedValue(revenueAnomaly);
      vi.spyOn(service as any, 'detectZeroStockAnomaly').mockResolvedValue(stockAnomaly);
      vi.spyOn(service as any, 'detectVipWithoutOrderAnomaly').mockResolvedValue(vipAnomaly);
      vi.spyOn(service as any, 'emitAnomalyEvent').mockResolvedValue(undefined);

      const result = await service.detectAnomalies(orgId);

      expect(result).toHaveLength(4);
      expect(result).toEqual([expenseAnomaly, revenueAnomaly, stockAnomaly, vipAnomaly]);
    });

    it('should filter out null results from detectors', async () => {
      vi.spyOn(service as any, 'detectExpenseAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectRevenueDropAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectZeroStockAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectVipWithoutOrderAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'emitAnomalyEvent').mockResolvedValue(undefined);

      const result = await service.detectAnomalies(orgId);

      expect(result).toEqual([]);
    });

    it('should include anomalies from only some detectors', async () => {
      const stockAnomaly = { type: 'ZERO_STOCK_ACTIVE_PRODUCTS', severity: 'HIGH' };

      vi.spyOn(service as any, 'detectExpenseAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectRevenueDropAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectZeroStockAnomaly').mockResolvedValue(stockAnomaly);
      vi.spyOn(service as any, 'detectVipWithoutOrderAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'emitAnomalyEvent').mockResolvedValue(undefined);

      const result = await service.detectAnomalies(orgId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(stockAnomaly);
    });

    it('should emit event for each detected anomaly', async () => {
      const anomaly1 = { type: 'EXPENSE_ABOVE_THRESHOLD', severity: 'HIGH', description: 'Expense high', data: {} };
      const anomaly2 = { type: 'VIP_WITHOUT_ORDER', severity: 'LOW', description: 'VIP inactive', data: {} };

      vi.spyOn(service as any, 'detectExpenseAnomaly').mockResolvedValue(anomaly1);
      vi.spyOn(service as any, 'detectRevenueDropAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectZeroStockAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectVipWithoutOrderAnomaly').mockResolvedValue(anomaly2);
      vi.spyOn(service as any, 'emitAnomalyEvent').mockResolvedValue(undefined);

      await service.detectAnomalies(orgId);

      expect(service['emitAnomalyEvent']).toHaveBeenCalledTimes(2);
      expect(service['emitAnomalyEvent']).toHaveBeenCalledWith(orgId, anomaly1);
      expect(service['emitAnomalyEvent']).toHaveBeenCalledWith(orgId, anomaly2);
    });

    it('should not emit events when no anomalies detected', async () => {
      vi.spyOn(service as any, 'detectExpenseAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectRevenueDropAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectZeroStockAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'detectVipWithoutOrderAnomaly').mockResolvedValue(null);
      vi.spyOn(service as any, 'emitAnomalyEvent').mockResolvedValue(undefined);

      await service.detectAnomalies(orgId);

      expect(service['emitAnomalyEvent']).not.toHaveBeenCalled();
    });
  });

  describe('detectExpenseAnomaly', () => {
    it('should detect expense anomaly when current > 150% of average', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 16000 } })  // current month expense
        .mockResolvedValueOnce({ _sum: { amount: 30000 } }); // past 3 months total

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('EXPENSE_ABOVE_THRESHOLD');
      expect(result!.severity).toBe('MEDIUM');
      expect(result!.data.currentExpense).toBe(16000);
      expect(result!.data.averageExpense).toBe(10000);
      expect(result!.data.ratio).toBe(1.6);
    });

    it('should return CRITICAL severity when ratio > 2', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 25000 } })  // current
        .mockResolvedValueOnce({ _sum: { amount: 10000 } }); // past total (avg ~3333)

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('CRITICAL');
    });

    it('should return HIGH severity when ratio > 1.75', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 6000 } })   // current
        .mockResolvedValueOnce({ _sum: { amount: 10000 } }); // past total (avg ~3333)

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('HIGH');
    });

    it('should return null when expense is below threshold', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 4000 } })   // current
        .mockResolvedValueOnce({ _sum: { amount: 30000 } }); // past total (avg 10000)

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should return null when past average is zero', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should return null when current expense is zero', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 30000 } });

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should handle null aggregate amounts', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service['detectExpenseAnomaly'](orgId);

      expect(result).toBeNull();
    });
  });

  describe('detectRevenueDropAnomaly', () => {
    it('should detect revenue drop when drop > 30%', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 6999 } })   // last month
        .mockResolvedValueOnce({ _sum: { amount: 10000 } }); // two months ago

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('REVENUE_DROP');
      expect(result!.severity).toBe('MEDIUM');
      expect(result!.data.dropPercent).toBe(30.01);
    });

    it('should return CRITICAL severity when drop > 50%', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 4000 } })
        .mockResolvedValueOnce({ _sum: { amount: 10000 } });

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('CRITICAL');
    });

    it('should return HIGH severity when drop > 40%', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5500 } })
        .mockResolvedValueOnce({ _sum: { amount: 10000 } });

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('HIGH');
    });

    it('should return null when drop is <= 30%', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 8000 } })
        .mockResolvedValueOnce({ _sum: { amount: 10000 } });

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should return null when two months ago revenue is zero', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should return null when both revenues are equal', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })
        .mockResolvedValueOnce({ _sum: { amount: 10000 } });

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should handle null aggregate amounts', async () => {
      prisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service['detectRevenueDropAnomaly'](orgId);

      expect(result).toBeNull();
    });
  });

  describe('detectZeroStockAnomaly', () => {
    it('should detect anomaly with single zero-stock product (LOW severity)', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Product A', sku: 'SKU-001' },
      ]);

      const result = await service['detectZeroStockAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('ZERO_STOCK_ACTIVE_PRODUCTS');
      expect(result!.severity).toBe('LOW');
      expect(result!.data.count).toBe(1);
    });

    it('should detect MEDIUM severity with 2-5 products', async () => {
      const products = Array.from({ length: 3 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Product ${i + 1}`,
        sku: `SKU-00${i + 1}`,
      }));
      prisma.product.findMany.mockResolvedValue(products);

      const result = await service['detectZeroStockAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('MEDIUM');
    });

    it('should detect HIGH severity with more than 5 products', async () => {
      const products = Array.from({ length: 6 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Product ${i + 1}`,
        sku: `SKU-00${i + 1}`,
      }));
      prisma.product.findMany.mockResolvedValue(products);

      const result = await service['detectZeroStockAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('HIGH');
    });

    it('should return null when no zero-stock products exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service['detectZeroStockAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should pass correct query filters', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service['detectZeroStockAnomaly'](orgId);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          isActive: true,
          stockQuantity: 0,
        },
        select: { id: true, name: true, sku: true },
      });
    });
  });

  describe('detectVipWithoutOrderAnomaly', () => {
    it('should detect anomaly with single VIP without order (LOW severity)', async () => {
      const sixtyOneDaysAgo = new Date();
      sixtyOneDaysAgo.setDate(sixtyOneDaysAgo.getDate() - 61);

      prisma.customer.findMany.mockResolvedValue([
        { id: 'c1', name: 'VIP Client', email: 'vip@test.com', lastOrderAt: sixtyOneDaysAgo },
      ]);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.type).toBe('VIP_WITHOUT_ORDER');
      expect(result!.severity).toBe('LOW');
      expect(result!.data.count).toBe(1);
    });

    it('should detect MEDIUM severity with 2-3 VIPs', async () => {
      const sixtyOneDaysAgo = new Date();
      sixtyOneDaysAgo.setDate(sixtyOneDaysAgo.getDate() - 61);

      const vips = Array.from({ length: 2 }, (_, i) => ({
        id: `c${i + 1}`,
        name: `VIP Client ${i + 1}`,
        email: `vip${i + 1}@test.com`,
        lastOrderAt: sixtyOneDaysAgo,
      }));
      prisma.customer.findMany.mockResolvedValue(vips);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('MEDIUM');
    });

    it('should detect HIGH severity with more than 3 VIPs', async () => {
      const sixtyOneDaysAgo = new Date();
      sixtyOneDaysAgo.setDate(sixtyOneDaysAgo.getDate() - 61);

      const vips = Array.from({ length: 4 }, (_, i) => ({
        id: `c${i + 1}`,
        name: `VIP Client ${i + 1}`,
        email: `vip${i + 1}@test.com`,
        lastOrderAt: sixtyOneDaysAgo,
      }));
      prisma.customer.findMany.mockResolvedValue(vips);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.severity).toBe('HIGH');
    });

    it('should treat null lastOrderAt as inactive', async () => {
      prisma.customer.findMany.mockResolvedValue([
        { id: 'c1', name: 'New VIP', email: 'new@test.com', lastOrderAt: null },
      ]);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.data.count).toBe(1);
    });

    it('should filter out VIPs with recent orders', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 90);

      prisma.customer.findMany.mockResolvedValue([
        { id: 'c1', name: 'Recent VIP', email: 'recent@test.com', lastOrderAt: recentDate },
        { id: 'c2', name: 'Old VIP', email: 'old@test.com', lastOrderAt: oldDate },
      ]);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).not.toBeNull();
      expect(result!.data.count).toBe(1);
      expect(result!.data.customers[0].name).toBe('Old VIP');
    });

    it('should return null when no VIP customers exist', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should return null when all VIPs have recent orders', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      prisma.customer.findMany.mockResolvedValue([
        { id: 'c1', name: 'Active VIP', email: 'active@test.com', lastOrderAt: recentDate },
      ]);

      const result = await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(result).toBeNull();
    });

    it('should pass correct query filters to prisma', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      await service['detectVipWithoutOrderAnomaly'](orgId);

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, segment: 'VIP' },
        select: { id: true, name: true, email: true, lastOrderAt: true },
      });
    });
  });

  describe('emitAnomalyEvent', () => {
    it('should emit ANOMALY_DETECTED event with correct payload', async () => {
      const anomaly = {
        type: 'TEST_TYPE',
        description: 'Test anomaly',
        severity: 'HIGH' as const,
        data: { someKey: 'someValue' },
      };

      await service['emitAnomalyEvent'](orgId, anomaly);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'ANOMALY_DETECTED',
        source: 'AnomalyDetectorService',
        payload: {
          organizationId: orgId,
          type: 'TEST_TYPE',
          description: 'Test anomaly',
          severity: 'HIGH',
          data: { someKey: 'someValue' },
        },
      });
    });
  });
});
