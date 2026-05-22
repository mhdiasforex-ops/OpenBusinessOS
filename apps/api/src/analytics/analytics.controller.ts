import { Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('metrics')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Dashboard metrics — receita, despesa, lucro, clientes ativos' })
  async getMetrics(@Request() req: any) {
    return this.analyticsService.getMetrics(req.user.organizationId);
  }

  @Get('revenue-time-series')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Série temporal de receita/despesa por mês' })
  async getRevenueTimeSeries(@Request() req: any, @Query('months') months?: number) {
    return this.analyticsService.getRevenueTimeSeries(req.user.organizationId, months ? +months : 12);
  }

  @Get('category-breakdown')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Breakdown por categoria (INCOME/EXPENSE)' })
  async getCategoryBreakdown(@Request() req: any, @Query('type') type: 'INCOME' | 'EXPENSE', @Query('months') months?: number) {
    return this.analyticsService.getCategoryBreakdown(req.user.organizationId, type, months ? +months : 3);
  }

  @Get('customer-segments')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Segmentos de clientes' })
  async getCustomerSegments(@Request() req: any) {
    return this.analyticsService.getCustomerSegments(req.user.organizationId);
  }

  @Get('product-performance')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Top produtos por desempenho' })
  async getProductPerformance(@Request() req: any, @Query('limit') limit?: number) {
    return this.analyticsService.getProductPerformance(req.user.organizationId, limit ? +limit : 10);
  }

  @Post('detect-anomalies')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Detectar anomalias nas métricas financeiras' })
  async detectAnomalies(@Request() req: any) {
    return this.analyticsService.detectAnomalies(req.user.organizationId);
  }
}
