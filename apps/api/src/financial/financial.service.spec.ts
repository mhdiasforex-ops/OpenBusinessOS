import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialService } from './financial.service';
import { PrismaService } from '../prisma/prisma.service';
import { CashFlowService } from './cash-flow.service';
import { ConciliationService } from './conciliation.service';
import { OverdueDetector } from './overdue-detector';
import { DreService } from './dre.service';
import { CmvService } from './cmv.service';
import { CreateTransactionDto, CashFlowQueryDto, ConciliateDto } from './financial.dto';

describe('FinancialService', () => {
  let service: FinancialService;
  let prisma: any;
  let eventBus: any;
  let cashFlowService: any;
  let conciliationService: any;
  let overdueDetector: any;
  let dreService: any;
  let cmvService: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
      },
      transactionItem: { create: vi.fn() },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    cashFlowService = {
      getCashFlow: vi.fn().mockResolvedValue({ entries: [], summary: {} }),
      getCashFlowByMonths: vi.fn().mockResolvedValue([{ month: '2026-01', entries: [], total: 0 }]),
    };
    conciliationService = { conciliate: vi.fn().mockResolvedValue({ matched: 5, unmatched: 1 }) };
    overdueDetector = { detect: vi.fn().mockResolvedValue([]) };
  dreService = {
    generateDRE: vi.fn().mockResolvedValue({ revenue: 10000, expenses: 6000, netProfit: 4000 }),
    getDREComparison: vi.fn().mockResolvedValue([{ month: '2026-01', revenue: 10000, expenses: 6000, netProfit: 4000 }]),
  };
  cmvService = { calculateCMV: vi.fn().mockResolvedValue({ cmv: 3000, margin: 0.7 }) };

    service = new FinancialService(prisma, eventBus, cashFlowService, conciliationService, overdueDetector, dreService, cmvService);
  });

  const orgId = 'org-123';
  const userId = 'user-1';

  describe('createTransaction', () => {
    const dto: CreateTransactionDto = {
      type: 'INCOME',
      category: 'Vendas',
      amount: 1500,
      description: 'Venda de produto X',
      dueDate: '2026-06-30',
    };

    it('should create a transaction and emit event', async () => {
      prisma.transaction.create.mockResolvedValue({ id: 'tx-1', ...dto, dueDate: new Date(dto.dueDate), organizationId: orgId });

      const result = await service.createTransaction(orgId, dto, userId);

      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should create transaction items if provided', async () => {
      const dtoWithItems = {
        ...dto,
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 50, total: 100 }],
      };
      prisma.transaction.create.mockResolvedValue({ id: 'tx-1', dueDate: new Date(dto.dueDate), organizationId: orgId });

      await service.createTransaction(orgId, dtoWithItems as any, userId);

      expect(prisma.transactionItem.create).toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([{ id: 'tx-1' }]);
      prisma.transaction.count.mockResolvedValue(10);

      const result = await service.getTransactions(orgId, { page: 1, perPage: 25 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it('should filter by type', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(orgId, { type: 'INCOME' });

      const call = prisma.transaction.findMany.mock.calls[0][0];
      expect(call.where.type).toBe('INCOME');
    });

    it('should filter by status', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(orgId, { status: 'PENDING' });

      const call = prisma.transaction.findMany.mock.calls[0][0];
      expect(call.where.status).toBe('PENDING');
    });
  });

  describe('getCashFlow', () => {
    it('should delegate to CashFlowService', async () => {
      const query: CashFlowQueryDto = { startDate: '2026-01-01', endDate: '2026-01-31' };

      const result = await service.getCashFlow(orgId, query);

      expect(cashFlowService.getCashFlow).toHaveBeenCalledWith(orgId, query);
    });
  });

  describe('getDRE', () => {
    it('should delegate to DreService with month and year', async () => {
      const result = await service.getDRE(orgId, 1, 2026);

      expect(dreService.generateDRE).toHaveBeenCalledWith(orgId, 1, 2026);
    });
  });

  describe('getCMV', () => {
    it('should delegate to CmvService with month and year', async () => {
      const result = await service.getCMV(orgId, 1, 2026);

      expect(cmvService.calculateCMV).toHaveBeenCalledWith(orgId, 1, 2026);
    });
  });

  describe('conciliate', () => {
    it('should delegate to ConciliationService with userId', async () => {
      const dto: ConciliateDto = {
        conciliationId: 'conc-001',
        items: [{ transactionId: 'tx-1', paidAt: '2026-06-25', paymentMethod: 'PIX' }],
      };

      const result = await service.conciliate(orgId, dto, userId);

      expect(conciliationService.conciliate).toHaveBeenCalledWith(orgId, dto, userId);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction with customer and items', async () => {
      prisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', amount: 1500, customer: { id: 'cust-1', name: 'Maria' }, items: [] });

      const result = await service.getTransaction(orgId, 'tx-1');
      expect(result.id).toBe('tx-1');
      expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'tx-1', organizationId: orgId },
        include: { customer: true, items: { include: { product: true } } },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);
      await expect(service.getTransaction(orgId, 'tx-999')).rejects.toThrow('Transação não encontrada');
    });
  });

  describe('getCashFlow', () => {
    it('should delegate to CashFlowService', async () => {
      const query: CashFlowQueryDto = { startDate: '2026-01-01', endDate: '2026-01-31' };

      const result = await service.getCashFlow(orgId, query);

      expect(cashFlowService.getCashFlow).toHaveBeenCalledWith(orgId, query);
    });
  });

  describe('getCashFlowByMonths', () => {
    it('should delegate to CashFlowService with default months', async () => {
      const result = await service.getCashFlowByMonths(orgId);
      expect(cashFlowService.getCashFlowByMonths).toHaveBeenCalledWith(orgId, 3);
    });

    it('should delegate with custom months param', async () => {
      const result = await service.getCashFlowByMonths(orgId, 6);
      expect(cashFlowService.getCashFlowByMonths).toHaveBeenCalledWith(orgId, 6);
    });
  });

  describe('getDRE', () => {
    it('should delegate to DreService with month and year', async () => {
      const result = await service.getDRE(orgId, 1, 2026);

      expect(dreService.generateDRE).toHaveBeenCalledWith(orgId, 1, 2026);
    });
  });

  describe('getDREComparison', () => {
    it('should delegate to DreService with default months', async () => {
      const result = await service.getDREComparison(orgId);
      expect(dreService.getDREComparison).toHaveBeenCalledWith(orgId, 3);
    });
  });

  describe('getCMV', () => {
    it('should delegate to CmvService with month and year', async () => {
      const result = await service.getCMV(orgId, 1, 2026);

      expect(cmvService.calculateCMV).toHaveBeenCalledWith(orgId, 1, 2026);
    });
  });

  describe('checkOverdue', () => {
    it('should delegate to OverdueDetector', async () => {
      const result = await service.checkOverdue(orgId);
      expect(overdueDetector.detect).toHaveBeenCalledWith(orgId);
    });
  });

  describe('markAsPaid', () => {
    it('should mark transaction as paid and emit event', async () => {
      prisma.transaction.findFirst.mockResolvedValue({ id: 'tx-1', amount: 1500, auditTrail: {} });
      prisma.transaction.update.mockResolvedValue({ id: 'tx-1', amount: 1500, status: 'PAID', paidAt: new Date(), auditTrail: {} });

      const result = await service.markAsPaid(orgId, 'tx-1', 'PIX', userId);

      expect(prisma.transaction.update).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'TRANSACTION_PAID',
        organizationId: orgId,
      }));
    });

    it('should throw NotFoundException when transaction not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);
      await expect(service.markAsPaid(orgId, 'tx-999', 'PIX', userId)).rejects.toThrow('Transação não encontrada');
    });
  });
});
