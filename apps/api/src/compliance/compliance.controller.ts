import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateComplianceRecordDto, UpdateComplianceRecordDto } from './compliance.dto';

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
@UseGuards(JwtGuard, PermissionsGuard)
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  // ── Records CRUD ─────────────────────────────────────────────────────

  @Post('records')
  @Permissions('compliance:manage')
  @ApiOperation({ summary: 'Criar registro de compliance' })
  async createRecord(@Request() req: any, @Body() dto: CreateComplianceRecordDto) {
    return this.complianceService.createRecord(req.user.organizationId, dto);
  }

  @Get('records')
  @Permissions('compliance:read')
  @ApiOperation({ summary: 'Listar registros de compliance' })
  @ApiQuery({ name: 'council', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async getRecords(
    @Request() req: any,
    @Query('council') council?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.complianceService.getRecords(req.user.organizationId, {
      council,
      status,
      search,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    });
  }

  @Get('records/:id')
  @Permissions('compliance:read')
  @ApiOperation({ summary: 'Buscar registro de compliance por ID' })
  async getRecord(@Request() req: any, @Param('id') id: string) {
    return this.complianceService.getRecord(req.user.organizationId, id);
  }

  @Patch('records/:id')
  @Permissions('compliance:manage')
  @ApiOperation({ summary: 'Atualizar registro de compliance' })
  async updateRecord(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateComplianceRecordDto,
  ) {
    return this.complianceService.updateRecord(req.user.organizationId, id, dto);
  }

  @Delete('records/:id')
  @Permissions('compliance:manage')
  @ApiOperation({ summary: 'Remover registro de compliance' })
  async deleteRecord(@Request() req: any, @Param('id') id: string) {
    return this.complianceService.deleteRecord(req.user.organizationId, id);
  }

  // ── Verify ───────────────────────────────────────────────────────────

  @Post('records/:id/verify')
  @Permissions('compliance:manage')
  @ApiOperation({ summary: 'Verificar registro de compliance' })
  async verifyRecord(@Request() req: any, @Param('id') id: string) {
    return this.complianceService.verifyRecord(req.user.organizationId, id);
  }

  // ── Councils ─────────────────────────────────────────────────────────

  @Get('councils')
  @Permissions('compliance:read')
  @ApiOperation({ summary: 'Listar conselhos de classe disponíveis' })
  async getCouncils() {
    return this.complianceService.getCouncils();
  }

  // ── Stats ────────────────────────────────────────────────────────────

  @Get('stats')
  @Permissions('compliance:read')
  @ApiOperation({ summary: 'Estatísticas de compliance por conselho/status' })
  async getStats(@Request() req: any) {
    return this.complianceService.getStats(req.user.organizationId);
  }

  // ── Expiring ─────────────────────────────────────────────────────────

  @Get('expiring')
  @Permissions('compliance:read')
  @ApiOperation({ summary: 'Registros próximos do vencimento' })
  @ApiQuery({ name: 'days', required: false, description: 'Dias até o vencimento (padrão: 30)' })
  async getExpiring(@Request() req: any, @Query('days') days?: string) {
    return this.complianceService.getExpiring(req.user.organizationId, days ? Number(days) : 30);
  }
}
