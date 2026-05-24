import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  let controller: DashboardController;
  let analyticsService: any;

  beforeEach(() => {
    analyticsService = {
      getDashboards: vi.fn().mockResolvedValue([{ id: 'dash-1', name: 'Main' }]),
      createDashboard: vi.fn().mockResolvedValue({ id: 'dash-2', name: 'Sales' }),
      updateDashboard: vi.fn().mockResolvedValue({ id: 'dash-1', name: 'Updated' }),
      deleteDashboard: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new DashboardController(analyticsService);
  });

  it('should call getDashboards with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getDashboards(req);
    expect(analyticsService.getDashboards).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([{ id: 'dash-1', name: 'Main' }]);
  });

  it('should call createDashboard with organizationId, name, layout, and isDefault', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const body = { name: 'Sales', layout: { widgets: [] }, isDefault: true };
    const result = await controller.createDashboard(req, body);
    expect(analyticsService.createDashboard).toHaveBeenCalledWith('org-123', 'Sales', { widgets: [] }, true);
    expect(result).toEqual({ id: 'dash-2', name: 'Sales' });
  });

  it('should call updateDashboard with organizationId, id, and body', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const body = { name: 'Updated' };
    const result = await controller.updateDashboard(req, 'dash-1', body);
    expect(analyticsService.updateDashboard).toHaveBeenCalledWith('org-123', 'dash-1', body);
    expect(result).toEqual({ id: 'dash-1', name: 'Updated' });
  });

  it('should call deleteDashboard with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.deleteDashboard(req, 'dash-1');
    expect(analyticsService.deleteDashboard).toHaveBeenCalledWith('org-123', 'dash-1');
    expect(result).toEqual({ success: true });
  });
});
