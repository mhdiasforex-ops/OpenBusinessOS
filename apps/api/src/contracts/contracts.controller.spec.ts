import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractsController } from './contracts.controller';

describe('ContractsController', () => {
  let controller: ContractsController;
  let contractsService: any;

  beforeEach(() => {
    contractsService = {
      createContract: vi.fn().mockResolvedValue({ id: 'ctr-1', supplier: 'Supplier A' }),
      getContracts: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getStats: vi.fn().mockResolvedValue({ total: 5, active: 3 }),
      getContract: vi.fn().mockResolvedValue({ id: 'ctr-1', supplier: 'Supplier A' }),
      updateContract: vi.fn().mockResolvedValue({ id: 'ctr-1', status: 'ACTIVE' }),
      deleteContract: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new ContractsController(contractsService);
  });

  it('should call createContract with organizationId and dto', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { supplier: 'Supplier A', value: 10000 };
    const result = await controller.createContract(req, dto);
    expect(contractsService.createContract).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'ctr-1', supplier: 'Supplier A' });
  });

  it('should call getContracts with organizationId and filters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const filters = { status: 'ACTIVE' };
    const result = await controller.getContracts(req, filters);
    expect(contractsService.getContracts).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should call getStats with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getStats(req);
    expect(contractsService.getStats).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ total: 5, active: 3 });
  });

  it('should call getContract with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getContract(req, 'ctr-1');
    expect(contractsService.getContract).toHaveBeenCalledWith('org-123', 'ctr-1');
    expect(result).toEqual({ id: 'ctr-1', supplier: 'Supplier A' });
  });

  it('should call updateContract with organizationId, id, and dto', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { status: 'ACTIVE' };
    const result = await controller.updateContract(req, 'ctr-1', dto);
    expect(contractsService.updateContract).toHaveBeenCalledWith('org-123', 'ctr-1', dto);
    expect(result).toEqual({ id: 'ctr-1', status: 'ACTIVE' });
  });

  it('should call deleteContract with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.deleteContract(req, 'ctr-1');
    expect(contractsService.deleteContract).toHaveBeenCalledWith('org-123', 'ctr-1');
    expect(result).toEqual({ success: true });
  });
});
