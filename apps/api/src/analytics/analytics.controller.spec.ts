import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: any;

  beforeEach(() => {
    analyticsService = {
      getMetrics: vi.fn().mockResolvedValue({ revenue: 10000 }),
      getRevenueTimeSeries: vi.fn().mockResolvedValue([{ month: '2024-01', revenue: 5000 }]),
      getCategoryBreakdown: vi.fn().mockResolvedValue([{ category: 'INCOME', total: 8000 }]),
      getCustomerSegments: vi.fn().mockResolvedValue([{ segment: 'VIP', count: 10 }]),
      getProductPerformance: vi.fn().mockResolvedValue([{ product: 'Prod A', revenue: 3000 }]),
      detectAnomalies: vi.fn().mockResolvedValue({ anomalies: [] }),
    };
    controller = new AnalyticsController(analyticsService);
  });

  it('should call getMetrics with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getMetrics(req);
    expect(analyticsService.getMetrics).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ revenue: 10000 });
  });

  it('should call getRevenueTimeSeries with organizationId and default months', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getRevenueTimeSeries(req, undefined);
    expect(analyticsService.getRevenueTimeSeries).toHaveBeenCalledWith('org-123', 12);
    expect(result).toEqual([{ month: '2024-01', revenue: 5000 }]);
  });

  it('should call getRevenueTimeSeries with custom months', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getRevenueTimeSeries(req, '6');
    expect(analyticsService.getRevenueTimeSeries).toHaveBeenCalledWith('org-123', 6);
    expect(result).toEqual([{ month: '2024-01', revenue: 5000 }]);
  });

  it('should call getCategoryBreakdown with organizationId, type, and default months', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCategoryBreakdown(req, 'INCOME', undefined);
    expect(analyticsService.getCategoryBreakdown).toHaveBeenCalledWith('org-123', 'INCOME', 3);
    expect(result).toEqual([{ category: 'INCOME', total: 8000 }]);
  });

  it('should call getCustomerSegments with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getCustomerSegments(req);
    expect(analyticsService.getCustomerSegments).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([{ segment: 'VIP', count: 10 }]);
  });

  it('should call getProductPerformance with organizationId and default limit', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getProductPerformance(req, undefined);
    expect(analyticsService.getProductPerformance).toHaveBeenCalledWith('org-123', 10);
    expect(result).toEqual([{ product: 'Prod A', revenue: 3000 }]);
  });

  it('should call detectAnomalies with organizationId', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.detectAnomalies(req);
    expect(analyticsService.detectAnomalies).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ anomalies: [] });
  });
});
