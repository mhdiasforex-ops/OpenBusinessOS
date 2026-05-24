import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChurnDetectorService } from './churn-detector.service';
import { EventTypes } from '@openbusinessos/event-definitions';

describe('ChurnDetectorService', () => {
  let service: ChurnDetectorService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      customer: {
        findMany: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };

    service = new ChurnDetectorService(prisma, eventBus);
  });

  const orgId = 'org-123';

  describe('detectAndEmitChurnRisk', () => {
    it('should return empty array and skip processing when customerIds is empty', async () => {
      const result = await service.detectAndEmitChurnRisk(orgId, []);

      expect(result).toEqual([]);
      expect(prisma.customer.findMany).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should process customers with transactions and emit churn risk events', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const customers = [
        {
          id: 'cust-1',
          name: 'Maria Santos',
          transactions: [{ paidAt: thirtyDaysAgo }],
        },
        {
          id: 'cust-2',
          name: 'João Silva',
          transactions: [{ paidAt: thirtyDaysAgo }],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);

      const result = await service.detectAndEmitChurnRisk(orgId, ['cust-1', 'cust-2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        customerId: 'cust-1',
        name: 'Maria Santos',
        riskScore: 0.7,
      });
      expect(result[1]).toMatchObject({
        customerId: 'cust-2',
        name: 'João Silva',
        riskScore: 0.7,
      });
      expect(result[0].lastOrderDaysAgo).toBeGreaterThanOrEqual(29);
      expect(result[1].lastOrderDaysAgo).toBeGreaterThanOrEqual(29);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['cust-1', 'cust-2'] }, organizationId: orgId },
        }),
      );
      expect(eventBus.emit).toHaveBeenCalledTimes(2);
      expect(eventBus.emit).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          organizationId: orgId,
          type: EventTypes.CUSTOMER_CHURN_RISK,
          source: 'churn-detector-service',
          payload: expect.objectContaining({
            customerId: 'cust-1',
            name: 'Maria Santos',
            riskScore: 0.7,
          }),
        }),
      );
      expect(eventBus.emit).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          organizationId: orgId,
          type: EventTypes.CUSTOMER_CHURN_RISK,
          source: 'churn-detector-service',
          payload: expect.objectContaining({
            customerId: 'cust-2',
            name: 'João Silva',
            riskScore: 0.7,
          }),
        }),
      );
    });

    it('should handle customers with no transactions (daysSinceEpoch)', async () => {
      const customers = [
        {
          id: 'cust-1',
          name: 'No Transactions',
          transactions: [],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);

      const result = await service.detectAndEmitChurnRisk(orgId, ['cust-1']);

      expect(result).toHaveLength(1);
      // When no transactions, paidAt is undefined → undefined || 0 → Date.now() - 0 = epoch-relative days
      expect(result[0].lastOrderDaysAgo).toBeGreaterThan(10000);
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            customerId: 'cust-1',
            riskScore: 0.7,
          }),
        }),
      );
    });

    it('should handle mixed scenarios: some customers have transactions, some do not', async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const customers = [
        {
          id: 'cust-with-order',
          name: 'Has Order',
          transactions: [{ paidAt: ninetyDaysAgo }],
        },
        {
          id: 'cust-no-order',
          name: 'No Order',
          transactions: [],
        },
      ];
      prisma.customer.findMany.mockResolvedValue(customers);

      const result = await service.detectAndEmitChurnRisk(orgId, ['cust-with-order', 'cust-no-order']);

      expect(result).toHaveLength(2);
      expect(result[0].customerId).toBe('cust-with-order');
      expect(result[0].lastOrderDaysAgo).toBeGreaterThanOrEqual(89);
      expect(result[1].customerId).toBe('cust-no-order');
      expect(result[1].lastOrderDaysAgo).toBeGreaterThan(10000);
    });

    it('should not emit events when no customers are found in database', async () => {
      prisma.customer.findMany.mockResolvedValue([]);

      const result = await service.detectAndEmitChurnRisk(orgId, ['cust-nonexistent']);

      expect(result).toEqual([]);
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });
});
