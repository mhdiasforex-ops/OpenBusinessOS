import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialController } from './financial.controller';

describe('FinancialController', () => {
  let controller: FinancialController;
  let financialService: any;

  beforeEach(() => {
    financialService = {
      createTransaction: vi.fn().mockResolvedValue({ id: 'tx-1', description: 'Sale' }),
      getTransactions: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getTransaction: vi.fn().mockResolvedValue({ id: 'tx-1', description: 'Sale' }),
      updateTransaction: vi.fn().mockResolvedValue({ id: 'tx-1', status: 'UPDATED' }),
      markAsPaid: vi.fn().mockResolvedValue({ id: 'tx-1', status: 'PAID' }),
      deleteTransaction: vi.fn().mockResolvedValue({ success: true }),
      checkOverdue: vi.fn().mockResolvedValue([{ id: 'tx-2', overdue: true }]),
      getCashFlowByMonths: vi.fn().mockResolvedValue([{ month: '2024-01', balance: 5000 }]),
      getCashFlow: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
      getCMV: vi.fn().mockResolvedValue({ cmv: 3000 }),
      getDRE: vi.fn().mockResolvedValue({ receita: 50000, despesa: 30000 }),
      getDREComparison: vi.fn().mockResolvedValue([{ month: '2024-01', receita: 50000 }]),
      conciliate: vi.fn().mockResolvedValue({ success: true, matched: 10 }),
    };
    controller = new FinancialController(financialService);
  });

  it('should call createTransaction with organizationId, dto, and userId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { description: 'Sale', amount: 1000, type: 'INCOME' };
    const result = await controller.createTransaction(req, dto);
    expect(financialService.createTransaction).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ id: 'tx-1', description: 'Sale' });
  });

  it('should call getTransactions with organizationId and filters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const filters = { type: 'INCOME' };
    const result = await controller.getTransactions(req, filters);
    expect(financialService.getTransactions).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should call getTransaction with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getTransaction(req, 'tx-1');
    expect(financialService.getTransaction).toHaveBeenCalledWith('org-123', 'tx-1');
    expect(result).toEqual({ id: 'tx-1', description: 'Sale' });
  });

  it('should call updateTransaction with organizationId, id, dto, and userId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { status: 'UPDATED' };
    const result = await controller.updateTransaction(req, 'tx-1', dto);
    expect(financialService.updateTransaction).toHaveBeenCalledWith('org-123', 'tx-1', dto, 'user-1');
    expect(result).toEqual({ id: 'tx-1', status: 'UPDATED' });
  });

  it('should call markAsPaid with organizationId, id, paymentMethod, and userId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.markAsPaid(req, 'tx-1', 'PIX');
    expect(financialService.markAsPaid).toHaveBeenCalledWith('org-123', 'tx-1', 'PIX', 'user-1');
    expect(result).toEqual({ id: 'tx-1', status: 'PAID' });
  });

  it('should call deleteTransaction with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.deleteTransaction(req, 'tx-1');
    expect(financialService.deleteTransaction).toHaveBeenCalledWith('org-123', 'tx-1');
    expect(result).toEqual({ success: true });
  });

  it('should call checkOverdue with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getOverdue(req);
    expect(financialService.checkOverdue).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([{ id: 'tx-2', overdue: true }]);
  });

  it('should call getCashFlowByMonths when months param is provided', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCashFlow(req, '6', undefined, undefined);
    expect(financialService.getCashFlowByMonths).toHaveBeenCalledWith('org-123', 6);
    expect(result).toEqual([{ month: '2024-01', balance: 5000 }]);
  });

  it('should call getCashFlow when startDate and endDate are provided', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCashFlow(req, undefined, '2024-01-01', '2024-03-31');
    expect(financialService.getCashFlow).toHaveBeenCalledWith('org-123', { startDate: '2024-01-01', endDate: '2024-03-31' });
    expect(result).toEqual({ entries: [], total: 0 });
  });

  it('should call getCashFlowByMonths with default 3 when no params', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCashFlow(req, undefined, undefined, undefined);
    expect(financialService.getCashFlowByMonths).toHaveBeenCalledWith('org-123', 3);
    expect(result).toEqual([{ month: '2024-01', balance: 5000 }]);
  });

  it('should call getCMV with organizationId, month, and year', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCMV(req, '6', '2024');
    expect(financialService.getCMV).toHaveBeenCalledWith('org-123', 6, 2024);
    expect(result).toEqual({ cmv: 3000 });
  });

  it('should call getDRE with organizationId, month, and year', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getDRE(req, '6', '2024');
    expect(financialService.getDRE).toHaveBeenCalledWith('org-123', 6, 2024);
    expect(result).toEqual({ receita: 50000, despesa: 30000 });
  });

  it('should call getDREComparison with organizationId and months', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getDREComparison(req, '6');
    expect(financialService.getDREComparison).toHaveBeenCalledWith('org-123', 6);
    expect(result).toEqual([{ month: '2024-01', receita: 50000 }]);
  });

  it('should call conciliate with organizationId, dto, and userId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { transactions: ['tx-1', 'tx-2'], bankStatementId: 'bs-1' };
    const result = await controller.conciliate(req, dto);
    expect(financialService.conciliate).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ success: true, matched: 10 });
  });
});
