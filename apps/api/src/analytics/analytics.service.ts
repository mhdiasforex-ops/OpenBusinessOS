import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';
import { CrossModuleService } from './cross-module.service';
import { AnomalyDetectorService } from './anomaly-detector.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
    private crossModuleService: CrossModuleService,
    private anomalyDetectorService: AnomalyDetectorService,
  ) {}

  // --- KPIs Financeiros (delegado para MetricsService) ---

  async getMetrics(orgId: string) {
    return this.metricsService.getMetrics(orgId);
  }

  async getRevenueTimeSeries(orgId: string, months: number = 12) {
    return this.metricsService.getRevenueTimeSeries(orgId, months);
  }

  async getCategoryBreakdown(orgId: string, type: 'INCOME' | 'EXPENSE', months: number = 3) {
    return this.metricsService.getCategoryBreakdown(orgId, type, months);
  }

  // --- Cross-Module Queries (delegado para CrossModuleService) ---

  async getCustomerSegments(orgId: string) {
    return this.crossModuleService.getCustomerSegments(orgId);
  }

  async getProductPerformance(orgId: string, limit: number = 10) {
    return this.crossModuleService.getProductPerformance(orgId, limit);
  }

  // --- Anomaly Detection (delegado para AnomalyDetectorService) ---

  async detectAnomalies(orgId: string) {
    return this.anomalyDetectorService.detectAnomalies(orgId);
  }

  // --- Dashboard CRUD ---

  async getDashboards(orgId: string) {
    return this.prisma.dashboard.findMany({
      where: { organizationId: orgId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createDashboard(orgId: string, name: string, layout: Record<string, any>, isDefault = false) {
    return this.prisma.dashboard.create({
      data: { organizationId: orgId, name, layout, isDefault },
    });
  }

  async updateDashboard(orgId: string, id: string, data: { name?: string; layout?: Record<string, any>; isDefault?: boolean }) {
    return this.prisma.dashboard.update({
      where: { id },
      data,
    });
  }

  async deleteDashboard(orgId: string, id: string) {
    return this.prisma.dashboard.delete({
      where: { id },
    });
  }
}
