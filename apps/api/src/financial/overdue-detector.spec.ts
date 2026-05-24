import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverdueDetector } from './overdue-detector';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { TransactionStatus } from '@prisma/client';

describe('OverdueDetector', () => {
  let service: OverdueDetector;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new OverdueDetector(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  const orgId = 'org-123';

  function makeTx(overrides: Partial<{
    id: string; organizationId: string; status: string;
    dueDate: Date; amount: number; customerId: string | null;
    customer: { id: string; name: string; email: string } | null;
  }> = {}) {
    return {
      id: overrides.id ?? 'tx-1',
      organizationId: overrides.organizationId ?? orgId,
      status: overrides.status ?? 'PENDING',
      dueDate: overrides.dueDate ?? new Date('2026-05-01'),
      amount: overrides.amount ?? 1000,
      customerId: overrides.customerId ?? null,
      customer: overrides.customer ?? null,
    };
  }

  describe('detect', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should query PENDING transactions with dueDate in the past', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      await service.detect(orgId);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it('should mark overdue transactions as OVERDUE', async () => {
      const overdueTx = makeTx({ id: 'tx-1', dueDate: new Date('2026-05-01') });
      prisma.transaction.findMany.mockResolvedValue([overdueTx]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });

      await service.detect(orgId);

      expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['tx-1'] } },
        data: { status: TransactionStatus.OVERDUE },
      });
    });

    it('should emit PAYMENT_OVERDUE event for each overdue transaction', async () => {
      const overdueTx = makeTx({
        id: 'tx-1',
        amount: 1500,
        dueDate: new Date('2026-06-01'),
        customerId: 'cust-1',
        customer: { id: 'cust-1', name: 'John', email: 'john@test.com' },
      });
      prisma.transaction.findMany.mockResolvedValue([overdueTx]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });

      await service.detect(orgId);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: EventTypes.PAYMENT_OVERDUE,
        source: 'overdue-detector',
        payload: {
          transactionId: 'tx-1',
          amount: 1500,
          daysOverdue: 15,
          customerId: 'cust-1',
        },
      });
    });

    it('should calculate daysOverdue correctly', async () => {
      vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
      const fiveDaysAgo = new Date('2026-06-10T10:00:00Z');
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ id: 'tx-1', dueDate: fiveDaysAgo, amount: 500 }),
      ]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });

      await service.detect(orgId);

      expect(eventBus.emit.mock.calls[0][0].payload.daysOverdue).toBe(5);
    });

    it('should handle one day overdue', async () => {
      vi.setSystemTime(new Date('2026-06-11T10:00:00Z'));
      const yesterday = new Date('2026-06-10T10:00:00Z');
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ id: 'tx-1', dueDate: yesterday, amount: 200 }),
      ]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });

      await service.detect(orgId);

      expect(eventBus.emit.mock.calls[0][0].payload.daysOverdue).toBe(1);
    });

    it('should handle no overdue transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.detect(orgId);

      expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
      expect(result.count).toBe(0);
      expect(result.transactions).toEqual([]);
    });

    it('should handle multiple overdue transactions', async () => {
      const tx1 = makeTx({ id: 'tx-1', amount: 500, dueDate: new Date('2026-05-01'), customerId: 'cust-1' });
      const tx2 = makeTx({ id: 'tx-2', amount: 300, dueDate: new Date('2026-05-15'), customerId: 'cust-2' });
      prisma.transaction.findMany.mockResolvedValue([tx1, tx2]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.detect(orgId);

      expect(result.count).toBe(2);
      expect(result.transactions).toHaveLength(2);
      expect(prisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['tx-1', 'tx-2'] } },
        data: { status: TransactionStatus.OVERDUE },
      });
      expect(eventBus.emit).toHaveBeenCalledTimes(2);
    });

    it('should emit event even for transactions without customer', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          id: 'tx-nocust',
          amount: 100,
          dueDate: new Date('2026-06-01'),
          customerId: null,
          customer: null,
        }),
      ]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });

      await service.detect(orgId);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: EventTypes.PAYMENT_OVERDUE,
        source: 'overdue-detector',
        payload: expect.objectContaining({
          transactionId: 'tx-nocust',
          customerId: null,
        }),
      });
    });

    it('should return the overdue transactions in result', async () => {
      const tx = makeTx({ id: 'tx-1', amount: 1000, dueDate: new Date('2026-06-01') });
      prisma.transaction.findMany.mockResolvedValue([tx]);
      prisma.transaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.detect(orgId);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].id).toBe('tx-1');
      expect(result.transactions[0].amount).toBe(1000);
    });

    it('should include customer details in query result', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      await service.detect(orgId);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            customer: { select: { id: true, name: true, email: true } },
          },
        }),
      );
    });
  });
});
