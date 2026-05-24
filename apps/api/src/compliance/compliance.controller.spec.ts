import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceController } from './compliance.controller';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let complianceService: any;

  beforeEach(() => {
    complianceService = {
      createRecord: vi.fn().mockResolvedValue({ id: 'rec-1', council: 'CRM' }),
      getRecords: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getRecord: vi.fn().mockResolvedValue({ id: 'rec-1', council: 'CRM' }),
      updateRecord: vi.fn().mockResolvedValue({ id: 'rec-1', status: 'APPROVED' }),
      deleteRecord: vi.fn().mockResolvedValue({ success: true }),
      verifyRecord: vi.fn().mockResolvedValue({ id: 'rec-1', verified: true }),
      getCouncils: vi.fn().mockResolvedValue([{ code: 'CRM', name: 'Conselho Regional de Medicina' }]),
      getStats: vi.fn().mockResolvedValue({ total: 10, expiring: 2 }),
      getExpiring: vi.fn().mockResolvedValue([{ id: 'rec-2', daysLeft: 15 }]),
    };
    controller = new ComplianceController(complianceService);
  });

  it('should call createRecord with organizationId and dto', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { council: 'CRM', documentNumber: '12345' };
    const result = await controller.createRecord(req, dto);
    expect(complianceService.createRecord).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'rec-1', council: 'CRM' });
  });

  it('should call getRecords with organizationId and filters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getRecords(req, 'CRM', 'ACTIVE', 'search', 1, 20);
    expect(complianceService.getRecords).toHaveBeenCalledWith('org-123', {
      council: 'CRM',
      status: 'ACTIVE',
      search: 'search',
      page: 1,
      perPage: 20,
    });
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should call getRecord with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getRecord(req, 'rec-1');
    expect(complianceService.getRecord).toHaveBeenCalledWith('org-123', 'rec-1');
    expect(result).toEqual({ id: 'rec-1', council: 'CRM' });
  });

  it('should call updateRecord with organizationId, id, and dto', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { status: 'APPROVED' };
    const result = await controller.updateRecord(req, 'rec-1', dto);
    expect(complianceService.updateRecord).toHaveBeenCalledWith('org-123', 'rec-1', dto);
    expect(result).toEqual({ id: 'rec-1', status: 'APPROVED' });
  });

  it('should call deleteRecord with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.deleteRecord(req, 'rec-1');
    expect(complianceService.deleteRecord).toHaveBeenCalledWith('org-123', 'rec-1');
    expect(result).toEqual({ success: true });
  });

  it('should call verifyRecord with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.verifyRecord(req, 'rec-1');
    expect(complianceService.verifyRecord).toHaveBeenCalledWith('org-123', 'rec-1');
    expect(result).toEqual({ id: 'rec-1', verified: true });
  });

  it('should call getCouncils', async () => {
    const result = await controller.getCouncils();
    expect(complianceService.getCouncils).toHaveBeenCalledWith();
    expect(result).toEqual([{ code: 'CRM', name: 'Conselho Regional de Medicina' }]);
  });

  it('should call getStats with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getStats(req);
    expect(complianceService.getStats).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ total: 10, expiring: 2 });
  });

  it('should call getExpiring with organizationId and default days', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getExpiring(req, undefined);
    expect(complianceService.getExpiring).toHaveBeenCalledWith('org-123', 30);
    expect(result).toEqual([{ id: 'rec-2', daysLeft: 15 }]);
  });
});
