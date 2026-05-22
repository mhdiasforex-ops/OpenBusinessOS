import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';

@ApiTags('analytics/dashboards')
@ApiBearerAuth()
@Controller('analytics/dashboards')
@UseGuards(JwtGuard, PermissionsGuard)
export class DashboardController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Listar dashboards personalizados' })
  async getDashboards(@Request() req: any) {
    return this.analyticsService.getDashboards(req.user.organizationId);
  }

  @Post()
  @Permissions('analytics:manage')
  @ApiOperation({ summary: 'Criar dashboard personalizado' })
  async createDashboard(
    @Request() req: any,
    @Body() body: { name: string; layout: Record<string, any>; isDefault?: boolean },
  ) {
    return this.analyticsService.createDashboard(req.user.organizationId, body.name, body.layout, body.isDefault);
  }

  @Patch(':id')
  @Permissions('analytics:manage')
  @ApiOperation({ summary: 'Atualizar dashboard' })
  async updateDashboard(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; layout?: Record<string, any>; isDefault?: boolean },
  ) {
    return this.analyticsService.updateDashboard(req.user.organizationId, id, body);
  }

  @Delete(':id')
  @Permissions('analytics:manage')
  @ApiOperation({ summary: 'Remover dashboard' })
  async deleteDashboard(@Request() req: any, @Param('id') id: string) {
    return this.analyticsService.deleteDashboard(req.user.organizationId, id);
  }
}
