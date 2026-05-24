import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;
  let metricsService: any;
  let crossModuleService: any;
  let anomalyDetectorService: any;

  beforeEach(() => {
    prisma = {
      dashboard: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    metricsService = {
      getMetrics: vi.fn(),
      getRevenueTimeSeries: vi.fn(),
      getCategoryBreakdown: vi.fn(),
    };
    crossModuleService = {
      getCustomerSegments: vi.fn(),
      getProductPerformance: vi.fn(),
    };
    anomalyDetectorService = {
      detectAnomalies: vi.fn(),
    };

    service = new AnalyticsService(prisma, metricsService, crossModuleService, anomalyDetectorService);
  });

  const orgId = 'org-123';

  // --- Delegation tests ---

  describe('getMetrics', () => {
    it('should delegate to metricsService.getMetrics', async () => {
      const mockResult = { income: 1000, expense: 500, profit: 500 };
      metricsService.getMetrics.mockResolvedValue(mockResult);

      const result = await service.getMetrics(orgId);

      expect(metricsService.getMetrics).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from metricsService', async () => {
      const error = new Error('Metrics service failed');
      metricsService.getMetrics.mockRejectedValue(error);

      await expect(service.getMetrics(orgId)).rejects.toThrow('Metrics service failed');
    });
  });

  describe('getRevenueTimeSeries', () => {
    it('should delegate to metricsService with default months', async () => {
      const mockSeries = [{ date: '2026-05', income: 100, expense: 50, profit: 50 }];
      metricsService.getRevenueTimeSeries.mockResolvedValue(mockSeries);

      const result = await service.getRevenueTimeSeries(orgId);

      expect(metricsService.getRevenueTimeSeries).toHaveBeenCalledWith(orgId, 12);
      expect(result).toEqual(mockSeries);
    });

    it('should delegate to metricsService with custom months', async () => {
      metricsService.getRevenueTimeSeries.mockResolvedValue([]);

      await service.getRevenueTimeSeries(orgId, 6);

      expect(metricsService.getRevenueTimeSeries).toHaveBeenCalledWith(orgId, 6);
    });

    it('should propagate errors from metricsService', async () => {
      metricsService.getRevenueTimeSeries.mockRejectedValue(new Error('Time series failed'));

      await expect(service.getRevenueTimeSeries(orgId)).rejects.toThrow('Time series failed');
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should delegate to metricsService with type and default months', async () => {
      const mockBreakdown = [{ name: 'Vendas', value: 800, percentage: 80 }];
      metricsService.getCategoryBreakdown.mockResolvedValue(mockBreakdown);

      const result = await service.getCategoryBreakdown(orgId, 'INCOME');

      expect(metricsService.getCategoryBreakdown).toHaveBeenCalledWith(orgId, 'INCOME', 3);
      expect(result).toEqual(mockBreakdown);
    });

    it('should delegate to metricsService with type and custom months', async () => {
      metricsService.getCategoryBreakdown.mockResolvedValue([]);

      await service.getCategoryBreakdown(orgId, 'EXPENSE', 6);

      expect(metricsService.getCategoryBreakdown).toHaveBeenCalledWith(orgId, 'EXPENSE', 6);
    });

    it('should propagate errors from metricsService', async () => {
      metricsService.getCategoryBreakdown.mockRejectedValue(new Error('Breakdown failed'));

      await expect(service.getCategoryBreakdown(orgId, 'INCOME')).rejects.toThrow('Breakdown failed');
    });
  });

  describe('getCustomerSegments', () => {
    it('should delegate to crossModuleService.getCustomerSegments', async () => {
      const mockSegments = [{ segment: 'VIP', count: 10, totalLtv: 5000 }];
      crossModuleService.getCustomerSegments.mockResolvedValue(mockSegments);

      const result = await service.getCustomerSegments(orgId);

      expect(crossModuleService.getCustomerSegments).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockSegments);
    });

    it('should propagate errors from crossModuleService', async () => {
      crossModuleService.getCustomerSegments.mockRejectedValue(new Error('Segments failed'));

      await expect(service.getCustomerSegments(orgId)).rejects.toThrow('Segments failed');
    });
  });

  describe('getProductPerformance', () => {
    it('should delegate to crossModuleService with default limit', async () => {
      const mockProducts = [{ id: 'p1', name: 'Product A', margin: 30, isLowStock: false }];
      crossModuleService.getProductPerformance.mockResolvedValue(mockProducts);

      const result = await service.getProductPerformance(orgId);

      expect(crossModuleService.getProductPerformance).toHaveBeenCalledWith(orgId, 10);
      expect(result).toEqual(mockProducts);
    });

    it('should delegate to crossModuleService with custom limit', async () => {
      crossModuleService.getProductPerformance.mockResolvedValue([]);

      await service.getProductPerformance(orgId, 5);

      expect(crossModuleService.getProductPerformance).toHaveBeenCalledWith(orgId, 5);
    });

    it('should propagate errors from crossModuleService', async () => {
      crossModuleService.getProductPerformance.mockRejectedValue(new Error('Performance failed'));

      await expect(service.getProductPerformance(orgId)).rejects.toThrow('Performance failed');
    });
  });

  describe('detectAnomalies', () => {
    it('should delegate to anomalyDetectorService.detectAnomalies', async () => {
      const mockAnomalies = [{ type: 'EXPENSE_ABOVE_THRESHOLD', severity: 'HIGH' }];
      anomalyDetectorService.detectAnomalies.mockResolvedValue(mockAnomalies);

      const result = await service.detectAnomalies(orgId);

      expect(anomalyDetectorService.detectAnomalies).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockAnomalies);
    });

    it('should propagate errors from anomalyDetectorService', async () => {
      anomalyDetectorService.detectAnomalies.mockRejectedValue(new Error('Anomaly detection failed'));

      await expect(service.detectAnomalies(orgId)).rejects.toThrow('Anomaly detection failed');
    });
  });

  // --- Dashboard CRUD tests ---

  describe('getDashboards', () => {
    it('should return dashboards ordered by isDefault desc', async () => {
      const mockDashboards = [
        { id: 'd1', name: 'Main', isDefault: true },
        { id: 'd2', name: 'Custom', isDefault: false },
      ];
      prisma.dashboard.findMany.mockResolvedValue(mockDashboards);

      const result = await service.getDashboards(orgId);

      expect(prisma.dashboard.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { isDefault: 'desc' },
      });
      expect(result).toEqual(mockDashboards);
    });

    it('should return empty array when no dashboards exist', async () => {
      prisma.dashboard.findMany.mockResolvedValue([]);

      const result = await service.getDashboards(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('createDashboard', () => {
    it('should create a dashboard with all fields', async () => {
      const layout = { widgets: [{ type: 'chart', x: 0, y: 0 }] };
      const mockDashboard = { id: 'd-new', organizationId: orgId, name: 'My Dashboard', layout, isDefault: true };
      prisma.dashboard.create.mockResolvedValue(mockDashboard);

      const result = await service.createDashboard(orgId, 'My Dashboard', layout, true);

      expect(prisma.dashboard.create).toHaveBeenCalledWith({
        data: { organizationId: orgId, name: 'My Dashboard', layout, isDefault: true },
      });
      expect(result).toEqual(mockDashboard);
    });

    it('should create a dashboard with isDefault=false by default', async () => {
      const layout = {};
      prisma.dashboard.create.mockResolvedValue({ id: 'd-new', isDefault: false });

      await service.createDashboard(orgId, 'Dashboard', layout);

      expect(prisma.dashboard.create).toHaveBeenCalledWith({
        data: { organizationId: orgId, name: 'Dashboard', layout, isDefault: false },
      });
    });

    it('should create a dashboard with empty layout', async () => {
      prisma.dashboard.create.mockResolvedValue({ id: 'd-new' });

      await service.createDashboard(orgId, 'Empty Layout', {});

      expect(prisma.dashboard.create).toHaveBeenCalledWith({
        data: { organizationId: orgId, name: 'Empty Layout', layout: {}, isDefault: false },
      });
    });

    it('should propagate prisma errors', async () => {
      prisma.dashboard.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createDashboard(orgId, 'Fail', {}, false),
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateDashboard', () => {
    it('should update dashboard name and layout', async () => {
      const data = { name: 'Updated', layout: { updated: true } };
      const mockUpdated = { id: 'd1', ...data };
      prisma.dashboard.update.mockResolvedValue(mockUpdated);

      const result = await service.updateDashboard(orgId, 'd1', data);

      expect(prisma.dashboard.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data,
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should update only isDefault', async () => {
      prisma.dashboard.update.mockResolvedValue({ id: 'd1', isDefault: true });

      await service.updateDashboard(orgId, 'd1', { isDefault: true });

      expect(prisma.dashboard.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { isDefault: true },
      });
    });

    it('should propagate prisma not found error', async () => {
      const error = new Error('Record to update not found');
      prisma.dashboard.update.mockRejectedValue(error);

      await expect(
        service.updateDashboard(orgId, 'nonexistent', { name: 'Nope' }),
      ).rejects.toThrow('Record to update not found');
    });
  });

  describe('deleteDashboard', () => {
    it('should delete the dashboard by id', async () => {
      prisma.dashboard.delete.mockResolvedValue({ id: 'd1' });

      const result = await service.deleteDashboard(orgId, 'd1');

      expect(prisma.dashboard.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
      expect(result).toEqual({ id: 'd1' });
    });

    it('should propagate prisma not found error on delete', async () => {
      const error = new Error('Record to delete does not exist');
      prisma.dashboard.delete.mockRejectedValue(error);

      await expect(
        service.deleteDashboard(orgId, 'nonexistent'),
      ).rejects.toThrow('Record to delete does not exist');
    });
  });
});
