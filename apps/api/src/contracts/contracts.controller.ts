import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateContractDto, UpdateContractDto, ContractFiltersDto } from './contracts.dto';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtGuard, PermissionsGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  @Post()
  @Permissions('contracts:manage')
  @ApiOperation({ summary: 'Criar contrato' })
  @ApiResponse({ status: 201, description: 'Contrato criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async createContract(@Request() req: any, @Body() dto: CreateContractDto) {
    return this.contractsService.createContract(req.user.organizationId, dto);
  }

  // ──────────────────────────────────────────────
  // READ (list with filters + pagination)
  // ──────────────────────────────────────────────

  @Get()
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Listar contratos com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de contratos' })
  async getContracts(@Request() req: any, @Query() filters: ContractFiltersDto) {
    return this.contractsService.getContracts(req.user.organizationId, filters);
  }

  // ──────────────────────────────────────────────
  // STATS
  // ──────────────────────────────────────────────

  @Get('stats')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Estatísticas de contratos' })
  @ApiResponse({ status: 200, description: 'Resumo estatístico dos contratos' })
  async getStats(@Request() req: any) {
    return this.contractsService.getStats(req.user.organizationId);
  }

  // ──────────────────────────────────────────────
  // READ (one by ID)
  // ──────────────────────────────────────────────

  @Get(':id')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Buscar contrato por ID' })
  @ApiParam({ name: 'id', description: 'ID do contrato (cuid)' })
  @ApiResponse({ status: 200, description: 'Detalhes do contrato com fornecedor e cliente' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async getContract(@Request() req: any, @Param('id') id: string) {
    return this.contractsService.getContract(req.user.organizationId, id);
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  @Patch(':id')
  @Permissions('contracts:manage')
  @ApiOperation({ summary: 'Atualizar contrato' })
  @ApiParam({ name: 'id', description: 'ID do contrato (cuid)' })
  @ApiResponse({ status: 200, description: 'Contrato atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async updateContract(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.updateContract(req.user.organizationId, id, dto);
  }

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────

  @Delete(':id')
  @Permissions('contracts:manage')
  @ApiOperation({ summary: 'Remover contrato' })
  @ApiParam({ name: 'id', description: 'ID do contrato (cuid)' })
  @ApiResponse({ status: 200, description: 'Contrato removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async deleteContract(@Request() req: any, @Param('id') id: string) {
    return this.contractsService.deleteContract(req.user.organizationId, id);
  }
}
