import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateReportDto, UpdateReportDto, ReportListQueryDto } from './reports.dto';

@Controller('reports')
@UseGuards(JwtGuard, PermissionsGuard)
@ApiTags('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @Permissions('reports:create')
  @ApiOperation({ summary: 'Criar novo relatório' })
  async createReport(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Listar relatórios com paginação e filtros' })
  async getReports(@Request() req: any, @Query() query: ReportListQueryDto) {
    return this.reportsService.getReports(req.user.organizationId, query);
  }

  @Get('types')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Listar tipos de relatório disponíveis' })
  async getReportTypes() {
    return this.reportsService.getReportTypes();
  }

  @Get(':id')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Buscar relatório por ID' })
  async getReport(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.getReport(req.user.organizationId, id);
  }

  @Put(':id')
  @Permissions('reports:update')
  @ApiOperation({ summary: 'Atualizar relatório' })
  async updateReport(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.updateReport(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('reports:delete')
  @ApiOperation({ summary: 'Remover relatório' })
  async deleteReport(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.deleteReport(req.user.organizationId, id);
  }

  @Post(':id/run')
  @Permissions('reports:execute')
  @ApiOperation({ summary: 'Executar relatório' })
  async runReport(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.runReport(req.user.organizationId, id);
  }

  @Put(':id/toggle-active')
  @Permissions('reports:update')
  @ApiOperation({ summary: 'Ativar ou desativar agendamento do relatório' })
  async toggleActive(@Request() req: any, @Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.reportsService.toggleActive(req.user.organizationId, id, isActive);
  }
}
