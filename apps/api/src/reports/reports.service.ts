import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { CreateReportDto, UpdateReportDto, ReportListQueryDto, ReportSchedule, ReportFormat } from './reports.dto';

const REPORT_TYPES = [
  { value: 'sales', label: 'Relatório de vendas' },
  { value: 'financial', label: 'Relatório financeiro' },
  { value: 'inventory', label: 'Relatório de estoque' },
  { value: 'customers', label: 'Relatório de clientes' },
  { value: 'appointments', label: 'Relatório de agendamentos' },
];

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // --- Helpers ---

  private calculateNextRunAt(schedule: ReportSchedule): Date | null {
    const now = new Date();
    switch (schedule) {
      case ReportSchedule.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ReportSchedule.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case ReportSchedule.MONTHLY: {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1);
        return d;
      }
      case ReportSchedule.QUARTERLY: {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 3);
        return d;
      }
      case ReportSchedule.YEARLY: {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() + 1);
        return d;
      }
      case ReportSchedule.ONCE:
        return null;
      default:
        return null;
    }
  }

  // --- CRUD ---

  async createReport(orgId: string, dto: CreateReportDto) {
    const schedule = dto.schedule ?? ReportSchedule.ONCE;
    const nextRunAt = this.calculateNextRunAt(schedule);

    const report = await this.prisma.report.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        config: dto.config ?? {},
        format: dto.format ?? ReportFormat.PDF,
        schedule,
        nextRunAt,
        isActive: true,
      },
    });

    this.logger.log(`Report created: ${report.id} (${report.name}) for org ${orgId}`);
    return report;
  }

  async getReports(orgId: string, query: ReportListQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: any = { organizationId: orgId };
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getReport(orgId: string, id: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!report) throw new NotFoundException(`Relatório ${id} não encontrado`);
    return report;
  }

  async updateReport(orgId: string, id: string, dto: UpdateReportDto) {
    await this.getReport(orgId, id);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.config !== undefined) data.config = dto.config;
    if (dto.format !== undefined) data.format = dto.format;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    // Recalcular nextRunAt se o schedule mudou
    if (dto.schedule !== undefined) {
      data.schedule = dto.schedule;
      data.nextRunAt = this.calculateNextRunAt(dto.schedule);
    }

    const report = await this.prisma.report.update({
      where: { id },
      data,
    });

    this.logger.log(`Report updated: ${id} for org ${orgId}`);
    return report;
  }

  async deleteReport(orgId: string, id: string) {
    await this.getReport(orgId, id);
    const report = await this.prisma.report.delete({ where: { id } });
    this.logger.log(`Report deleted: ${id} for org ${orgId}`);
    return report;
  }

  // --- Execução ---

  async runReport(orgId: string, id: string) {
    const report = await this.getReport(orgId, id);

    const now = new Date();
    const nextRunAt = this.calculateNextRunAt(report.schedule as ReportSchedule);

    await this.prisma.report.update({
      where: { id },
      data: {
        lastRunAt: now,
        nextRunAt,
      },
    });

    // Emitir evento de execução de relatório
    await this.eventBus.emit({
      organizationId: orgId,
      type: 'report.executed',
      source: 'reports',
      payload: {
        reportId: id,
        reportName: report.name,
        reportType: report.type,
        format: report.format,
        config: report.config,
        executedAt: now.toISOString(),
      },
    });

    this.logger.log(`Report executed: ${id} (${report.name}) for org ${orgId}`);

    return {
      reportId: id,
      reportName: report.name,
      reportType: report.type,
      format: report.format,
      lastRunAt: now,
      nextRunAt,
      status: 'completed',
    };
  }

  // --- Tipos disponíveis ---

  getReportTypes() {
    return REPORT_TYPES;
  }

  // --- Toggle ativo/inativo ---

  async toggleActive(orgId: string, id: string, isActive: boolean) {
    await this.getReport(orgId, id);

    const data: any = { isActive };

    // Se reativando, recalcular nextRunAt
    if (isActive) {
      data.nextRunAt = this.calculateNextRunAt(
        (await this.prisma.report.findUnique({ where: { id } }))!.schedule as ReportSchedule,
      );
    } else {
      data.nextRunAt = null;
    }

    const report = await this.prisma.report.update({
      where: { id },
      data,
    });

    this.logger.log(`Report ${id} ${isActive ? 'activated' : 'deactivated'} for org ${orgId}`);
    return report;
  }
}
