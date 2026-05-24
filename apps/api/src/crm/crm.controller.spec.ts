import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmController } from './crm.controller';

describe('CrmController', () => {
  let controller: CrmController;
  let crmService: any;

  beforeEach(() => {
    crmService = {
      createCustomer: vi.fn().mockResolvedValue({ id: 'cust-1', name: 'John' }),
      getCustomers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getCustomer: vi.fn().mockResolvedValue({ id: 'cust-1', name: 'John' }),
      updateCustomer: vi.fn().mockResolvedValue({ id: 'cust-1', name: 'John Updated' }),
      deleteCustomer: vi.fn().mockResolvedValue({ success: true }),
      calculateLTV: vi.fn().mockResolvedValue({ ltv: 5000 }),
      segmentCustomers: vi.fn().mockResolvedValue({ segments: { vip: 5, regular: 20 } }),
    };
    controller = new CrmController(crmService);
  });

  it('should call createCustomer with organizationId and dto', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { name: 'John', email: 'john@test.com' };
    const result = await controller.createCustomer(req, dto);
    expect(crmService.createCustomer).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'cust-1', name: 'John' });
  });

  it('should call getCustomers with organizationId and filters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const filters = { search: 'John' };
    const result = await controller.getCustomers(req, filters);
    expect(crmService.getCustomers).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should call getCustomer with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCustomer(req, 'cust-1');
    expect(crmService.getCustomer).toHaveBeenCalledWith('org-123', 'cust-1');
    expect(result).toEqual({ id: 'cust-1', name: 'John' });
  });

  it('should call updateCustomer with organizationId, id, and dto', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { name: 'John Updated' };
    const result = await controller.updateCustomer(req, 'cust-1', dto);
    expect(crmService.updateCustomer).toHaveBeenCalledWith('org-123', 'cust-1', dto);
    expect(result).toEqual({ id: 'cust-1', name: 'John Updated' });
  });

  it('should call deleteCustomer with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.deleteCustomer(req, 'cust-1');
    expect(crmService.deleteCustomer).toHaveBeenCalledWith('org-123', 'cust-1');
    expect(result).toEqual({ success: true });
  });

  it('should call calculateLTV with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.calculateLTV(req, 'cust-1');
    expect(crmService.calculateLTV).toHaveBeenCalledWith('org-123', 'cust-1');
    expect(result).toEqual({ ltv: 5000 });
  });

  it('should call segmentCustomers with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.segmentCustomers(req);
    expect(crmService.segmentCustomers).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ segments: { vip: 5, regular: 20 } });
  });
});
