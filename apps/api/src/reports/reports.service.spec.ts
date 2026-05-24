import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { NotFoundException } from '@nestjs/common';
import { ReportFormat, ReportSchedule, CreateReportDto, UpdateReportDto, ReportListQueryDto } from './reports.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-123';

  beforeEach(() => {
    prisma = {
      report: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new ReportsService(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateNextRunAt (private)', () => {
    it('should return date 24h ahead for DAILY schedule', () => {
      const result = service['calculateNextRunAt'](ReportSchedule.DAILY);
      expect(result).toBeInstanceOf(Date);
      const diff = result!.getTime() - Date.now();
      expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it('should return date 7 days ahead for WEEKLY schedule', () => {
      const result = service['calculateNextRunAt'](ReportSchedule.WEEKLY);
      expect(result).toBeInstanceOf(Date);
      const diff = result!.getTime() - Date.now();
      expect(diff).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(7.1 * 24 * 60 * 60 * 1000);
    });

    it('should return date 1 month ahead for MONTHLY schedule', () => {
      const now = new Date();
      const result = service['calculateNextRunAt'](ReportSchedule.MONTHLY);
      expect(result).toBeInstanceOf(Date);
      const expectedMonth = now.getMonth() + 1;
      expect(result!.getMonth()).toBe(expectedMonth % 12);
    });

    it('should return date 3 months ahead for QUARTERLY schedule', () => {
      const now = new Date();
      const result = service['calculateNextRunAt'](ReportSchedule.QUARTERLY);
      expect(result).toBeInstanceOf(Date);
      const expectedMonth = now.getMonth() + 3;
      expect(result!.getMonth()).toBe(expectedMonth % 12);
    });

    it('should return date 1 year ahead for YEARLY schedule', () => {
      const now = new Date();
      const result = service['calculateNextRunAt'](ReportSchedule.YEARLY);
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(now.getFullYear() + 1);
    });

    it('should return null for ONCE schedule', () => {
      const result = service['calculateNextRunAt'](ReportSchedule.ONCE);
      expect(result).toBeNull();
    });

    it('should return null for default/unknown schedule', () => {
      const result = service['calculateNextRunAt']('UNKNOWN' as any);
      expect(result).toBeNull();
    });
  });

  describe('createReport', () => {
    const dto: CreateReportDto = {
      name: 'Relatório de Vendas Mensal',
      description: 'Resumo de vendas do mês anterior',
      type: 'sales',
      config: { dateRange: 'last_month', groupBy: 'category' },
      format: ReportFormat.PDF,
      schedule: ReportSchedule.MONTHLY,
    };

    it('should create a report with all provided fields', async () => {
      const created = { id: 'rpt-1', organizationId: orgId, ...dto, nextRunAt: expect.any(Date), isActive: true };
      prisma.report.create.mockResolvedValue(created);

      const result = await service.createReport(orgId, dto);

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name: dto.name,
          description: dto.description,
          type: dto.type,
          config: dto.config,
          format: dto.format,
          schedule: dto.schedule,
          nextRunAt: expect.any(Date),
          isActive: true,
        },
      });
      expect(result).toEqual(created);
    });

    it('should default schedule to ONCE and nextRunAt to null when not provided', async () => {
      const dtoNoSchedule: CreateReportDto = { name: 'Simple', type: 'sales' };
      prisma.report.create.mockResolvedValue({ id: 'rpt-1', organizationId: orgId, name: 'Simple', type: 'sales', schedule: ReportSchedule.ONCE, nextRunAt: null, isActive: true });

      await service.createReport(orgId, dtoNoSchedule);

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schedule: ReportSchedule.ONCE,
          nextRunAt: null,
        }),
      });
    });

    it('should default format to PDF when not provided', async () => {
      prisma.report.create.mockResolvedValue({ id: 'rpt-1', organizationId: orgId, name: 'test', type: 'sales', format: ReportFormat.PDF });

      await service.createReport(orgId, { name: 'test', type: 'sales' });

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ format: ReportFormat.PDF }),
      });
    });

    it('should default config to empty object when not provided', async () => {
      prisma.report.create.mockResolvedValue({ id: 'rpt-1', organizationId: orgId, name: 'test', type: 'sales', config: {} });

      await service.createReport(orgId, { name: 'test', type: 'sales' });

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ config: {} }),
      });
    });

    it('should default description to undefined when not provided', async () => {
      prisma.report.create.mockResolvedValue({ id: 'rpt-1', organizationId: orgId, name: 'test', type: 'sales' });

      await service.createReport(orgId, { name: 'test', type: 'sales' });

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: undefined }),
      });
    });

    it('should set isActive to true by default', async () => {
      prisma.report.create.mockResolvedValue({ id: 'rpt-1', organizationId: orgId, name: 'test', type: 'sales' });

      await service.createReport(orgId, { name: 'test', type: 'sales' });

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isActive: true }),
      });
    });
  });

  describe('getReports', () => {
    it('should return paginated reports with default values', async () => {
      const items = [{ id: 'rpt-1', name: 'Report A' }];
      prisma.report.findMany.mockResolvedValue(items);
      prisma.report.count.mockResolvedValue(1);

      const result = await service.getReports(orgId, {});

      expect(prisma.report.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.report.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect(result).toEqual({ items, total: 1, page: 1, perPage: 20, totalPages: 1 });
    });

    it('should filter by type', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.getReports(orgId, { type: 'financial' });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, type: 'financial' },
        }),
      );
    });

    it('should filter by isActive true', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.getReports(orgId, { isActive: true });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, isActive: true },
        }),
      );
    });

    it('should filter by isActive false', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.getReports(orgId, { isActive: false });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, isActive: false },
        }),
      );
    });

    it('should apply pagination with custom page and perPage', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.getReports(orgId, { page: 3, perPage: 10 });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(25);

      const result = await service.getReports(orgId, { perPage: 10 });

      expect(result.totalPages).toBe(3);
    });

    it('should not include isActive filter when undefined', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.getReports(orgId, { page: 1, perPage: 20 });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId },
        }),
      );
      expect(prisma.report.findMany.mock.calls[0][0].where.isActive).toBeUndefined();
    });
  });

  describe('getReport', () => {
    it('should return report when found', async () => {
      const report = { id: 'rpt-1', organizationId: orgId, name: 'Report A' };
      prisma.report.findFirst.mockResolvedValue(report);

      const result = await service.getReport(orgId, 'rpt-1');

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { id: 'rpt-1', organizationId: orgId },
      });
      expect(result).toEqual(report);
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.getReport(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when report belongs to another org', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.getReport(orgId, 'rpt-other-org')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReport', () => {
    const existingReport = {
      id: 'rpt-1',
      organizationId: orgId,
      name: 'Old Name',
      description: 'Old description',
      type: 'sales',
      config: {},
      format: ReportFormat.PDF,
      schedule: ReportSchedule.ONCE,
      isActive: true,
      nextRunAt: null,
    };

    it('should verify report exists then perform partial update', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      const updated = { ...existingReport, name: 'New Name', description: 'New desc' };
      prisma.report.update.mockResolvedValue(updated);

      const result = await service.updateReport(orgId, 'rpt-1', { name: 'New Name', description: 'New desc' });

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { id: 'rpt-1', organizationId: orgId },
      });
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: { name: 'New Name', description: 'New desc' },
      });
      expect(result).toEqual(updated);
    });

    it('should update schedule and recalculate nextRunAt when schedule changes', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      prisma.report.update.mockResolvedValue({ ...existingReport, schedule: ReportSchedule.DAILY, nextRunAt: expect.any(Date) });

      await service.updateReport(orgId, 'rpt-1', { schedule: ReportSchedule.DAILY });

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: {
          schedule: ReportSchedule.DAILY,
          nextRunAt: expect.any(Date),
        },
      });
    });

    it('should set nextRunAt to null when schedule changes to ONCE', async () => {
      prisma.report.findFirst.mockResolvedValue({ ...existingReport, schedule: ReportSchedule.DAILY, nextRunAt: new Date() });
      prisma.report.update.mockResolvedValue({ ...existingReport, schedule: ReportSchedule.ONCE, nextRunAt: null });

      await service.updateReport(orgId, 'rpt-1', { schedule: ReportSchedule.ONCE });

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: { schedule: ReportSchedule.ONCE, nextRunAt: null },
      });
    });

    it('should update config and format when provided', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      prisma.report.update.mockResolvedValue({ ...existingReport, config: { new: true }, format: ReportFormat.XLSX });

      await service.updateReport(orgId, 'rpt-1', { config: { new: true }, format: ReportFormat.XLSX });

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: { config: { new: true }, format: ReportFormat.XLSX },
      });
    });

    it('should update type and isActive when provided', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      prisma.report.update.mockResolvedValue({ ...existingReport, type: 'financial', isActive: false });

      await service.updateReport(orgId, 'rpt-1', { type: 'financial', isActive: false });

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: { type: 'financial', isActive: false },
      });
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(
        service.updateReport(orgId, 'nonexistent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.report.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteReport', () => {
    it('should verify report exists then delete it', async () => {
      const report = { id: 'rpt-1', organizationId: orgId, name: 'Report A' };
      prisma.report.findFirst.mockResolvedValue(report);
      prisma.report.delete.mockResolvedValue(report);

      const result = await service.deleteReport(orgId, 'rpt-1');

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { id: 'rpt-1', organizationId: orgId },
      });
      expect(prisma.report.delete).toHaveBeenCalledWith({ where: { id: 'rpt-1' } });
      expect(result).toEqual(report);
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.deleteReport(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.report.delete).not.toHaveBeenCalled();
    });
  });

  describe('runReport', () => {
    it('should update lastRunAt and nextRunAt, emit event, and return result', async () => {
      const report = {
        id: 'rpt-1',
        organizationId: orgId,
        name: 'Monthly Sales',
        type: 'sales',
        format: ReportFormat.PDF,
        config: { dateRange: 'last_month' },
        schedule: ReportSchedule.MONTHLY,
      };
      prisma.report.findFirst.mockResolvedValue(report);
      prisma.report.update.mockResolvedValue({ ...report, lastRunAt: expect.any(Date), nextRunAt: expect.any(Date) });

      const result = await service.runReport(orgId, 'rpt-1');

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { id: 'rpt-1', organizationId: orgId },
      });
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: {
          lastRunAt: expect.any(Date),
          nextRunAt: expect.any(Date),
        },
      });
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'report.executed',
        source: 'reports',
        payload: {
          reportId: 'rpt-1',
          reportName: 'Monthly Sales',
          reportType: 'sales',
          format: ReportFormat.PDF,
          config: { dateRange: 'last_month' },
          executedAt: expect.any(String),
        },
      });
      expect(result).toMatchObject({
        reportId: 'rpt-1',
        reportName: 'Monthly Sales',
        reportType: 'sales',
        format: ReportFormat.PDF,
        status: 'completed',
      });
      expect(result.lastRunAt).toBeInstanceOf(Date);
    });

    it('should set nextRunAt to null for ONCE schedule', async () => {
      const report = {
        id: 'rpt-1',
        organizationId: orgId,
        name: 'One-off',
        type: 'sales',
        format: ReportFormat.PDF,
        config: {},
        schedule: ReportSchedule.ONCE,
      };
      prisma.report.findFirst.mockResolvedValue(report);
      prisma.report.update.mockResolvedValue({ ...report, lastRunAt: new Date(), nextRunAt: null });

      const result = await service.runReport(orgId, 'rpt-1');

      expect(result.nextRunAt).toBeNull();
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.runReport(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.report.update).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('getReportTypes', () => {
    it('should return all report types', () => {
      const result = service.getReportTypes();

      expect(result).toEqual([
        { value: 'sales', label: 'Relatório de vendas' },
        { value: 'financial', label: 'Relatório financeiro' },
        { value: 'inventory', label: 'Relatório de estoque' },
        { value: 'customers', label: 'Relatório de clientes' },
        { value: 'appointments', label: 'Relatório de agendamentos' },
      ]);
    });
  });

  describe('toggleActive', () => {
    const existingReport = {
      id: 'rpt-1',
      organizationId: orgId,
      name: 'Report A',
      schedule: ReportSchedule.DAILY,
      nextRunAt: new Date(),
      isActive: true,
    };

    it('should activate report and recalculate nextRunAt', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      prisma.report.findUnique.mockResolvedValue(existingReport);
      prisma.report.update.mockResolvedValue({ ...existingReport, isActive: true, nextRunAt: expect.any(Date) });

      const result = await service.toggleActive(orgId, 'rpt-1', true);

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { id: 'rpt-1', organizationId: orgId },
      });
      expect(prisma.report.findUnique).toHaveBeenCalledWith({ where: { id: 'rpt-1' } });
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: { isActive: true, nextRunAt: expect.any(Date) },
      });
      expect(result.isActive).toBe(true);
    });

    it('should deactivate report and set nextRunAt to null', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      prisma.report.update.mockResolvedValue({ ...existingReport, isActive: false, nextRunAt: null });

      const result = await service.toggleActive(orgId, 'rpt-1', false);

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'rpt-1' },
        data: { isActive: false, nextRunAt: null },
      });
      expect(result.nextRunAt).toBeNull();
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when report does not exist', async () => {
      prisma.report.findFirst.mockResolvedValue(null);

      await expect(service.toggleActive(orgId, 'nonexistent', true)).rejects.toThrow(NotFoundException);
      expect(prisma.report.update).not.toHaveBeenCalled();
    });

    it('should not call findUnique when deactivating (isActive=false)', async () => {
      prisma.report.findFirst.mockResolvedValue(existingReport);
      prisma.report.update.mockResolvedValue({ ...existingReport, isActive: false });

      await service.toggleActive(orgId, 'rpt-1', false);

      expect(prisma.report.findUnique).not.toHaveBeenCalled();
    });
  });
});
