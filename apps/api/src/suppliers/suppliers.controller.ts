import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFiltersDto } from './suppliers.dto';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  @Post()
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Criar fornecedor' })
  @ApiResponse({ status: 201, description: 'Fornecedor criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'CNPJ já existe nesta organização' })
  async createSupplier(@Request() req: any, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(req.user.organizationId, dto);
  }

  // ──────────────────────────────────────────────
  // READ (list with filters + pagination)
  // ──────────────────────────────────────────────

  @Get()
  @Permissions('suppliers:read')
  @ApiOperation({ summary: 'Listar fornecedores com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de fornecedores' })
  async getSuppliers(@Request() req: any, @Query() filters: SupplierFiltersDto) {
    return this.suppliersService.getSuppliers(req.user.organizationId, filters);
  }

  // ──────────────────────────────────────────────
  // READ (one by ID)
  // ──────────────────────────────────────────────

  @Get(':id')
  @Permissions('suppliers:read')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor (cuid)' })
  @ApiResponse({ status: 200, description: 'Detalhes do fornecedor com contratos e pedidos recentes' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  async getSupplier(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.getSupplier(req.user.organizationId, id);
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  @Patch(':id')
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor (cuid)' })
  @ApiResponse({ status: 200, description: 'Fornecedor atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  @ApiResponse({ status: 409, description: 'CNPJ já existe nesta organização' })
  async updateSupplier(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.updateSupplier(req.user.organizationId, id, dto);
  }

  // ──────────────────────────────────────────────
  // DELETE (soft delete — desativa)
  // ──────────────────────────────────────────────

  @Delete(':id')
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Remover fornecedor (soft delete — desativa)' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor (cuid)' })
  @ApiResponse({ status: 200, description: 'Fornecedor desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  async deleteSupplier(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.deleteSupplier(req.user.organizationId, id);
  }

  // ──────────────────────────────────────────────
  // TOGGLE ACTIVE (ativar/desativar)
  // ──────────────────────────────────────────────

  @Patch(':id/toggle-active')
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Alternar status ativo/inativo do fornecedor' })
  @ApiParam({ name: 'id', description: 'ID do fornecedor (cuid)' })
  @ApiResponse({ status: 200, description: 'Status do fornecedor alterado com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  async toggleActive(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.toggleActive(req.user.organizationId, id);
  }
}
