import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsController } from './reports.controller';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      createReport: vi.fn().mockResolvedValue({ id: 'rpt-1' }),
      getReports: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getReportTypes: vi.fn().mockResolvedValue(['sales', 'financial']),
      getReport: vi.fn().mockResolvedValue({ id: 'rpt-1' }),
      updateReport: vi.fn().mockResolvedValue({ id: 'rpt-1' }),
      deleteReport: vi.fn().mockResolvedValue({ success: true }),
      runReport: vi.fn().mockResolvedValue({ url: 'https://...' }),
      toggleActive: vi.fn().mockResolvedValue({ id: 'rpt-1', isActive: true }),
    };
    controller = new ReportsController(service);
  });

  it('should create a report', async () => {
    const dto = { name: 'Sales Report', type: 'sales' } as any;
    const result = await controller.createReport(req, dto);
    expect(result).toEqual({ id: 'rpt-1' });
    expect(service.createReport).toHaveBeenCalledWith('org-123', dto);
  });

  it('should list reports', async () => {
    const query = { page: 1, perPage: 20 } as any;
    const result = await controller.getReports(req, query);
    expect(result).toEqual({ items: [], total: 0 });
    expect(service.getReports).toHaveBeenCalledWith('org-123', query);
  });

  it('should get report types', async () => {
    const result = await controller.getReportTypes();
    expect(result).toEqual(['sales', 'financial']);
    expect(service.getReportTypes).toHaveBeenCalled();
  });

  it('should get a report by id', async () => {
    const result = await controller.getReport(req, 'rpt-1');
    expect(result).toEqual({ id: 'rpt-1' });
    expect(service.getReport).toHaveBeenCalledWith('org-123', 'rpt-1');
  });

  it('should update a report', async () => {
    const dto = { name: 'Updated' } as any;
    const result = await controller.updateReport(req, 'rpt-1', dto);
    expect(result).toEqual({ id: 'rpt-1' });
    expect(service.updateReport).toHaveBeenCalledWith('org-123', 'rpt-1', dto);
  });

  it('should delete a report', async () => {
    const result = await controller.deleteReport(req, 'rpt-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteReport).toHaveBeenCalledWith('org-123', 'rpt-1');
  });

  it('should run a report', async () => {
    const result = await controller.runReport(req, 'rpt-1');
    expect(result).toEqual({ url: 'https://...' });
    expect(service.runReport).toHaveBeenCalledWith('org-123', 'rpt-1');
  });

  it('should toggle active', async () => {
    const result = await controller.toggleActive(req, 'rpt-1', true);
    expect(result).toEqual({ id: 'rpt-1', isActive: true });
    expect(service.toggleActive).toHaveBeenCalledWith('org-123', 'rpt-1', true);
  });
});
