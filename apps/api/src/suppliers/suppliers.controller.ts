import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Post()
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Criar fornecedor' })
  async createSupplier(@Request() req: any, @Body() dto: any) {
    return this.suppliersService.createSupplier(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('suppliers:read')
  @ApiOperation({ summary: 'Listar fornecedores' })
  async getSuppliers(@Request() req: any, @Query() filters: any) {
    return this.suppliersService.getSuppliers(req.user.organizationId, filters);
  }

  @Get(':id')
  @Permissions('suppliers:read')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  async getSupplier(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.getSupplier(req.user.organizationId, id);
  }

  @Patch(':id')
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  async updateSupplier(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.suppliersService.updateSupplier(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('suppliers:manage')
  @ApiOperation({ summary: 'Remover fornecedor' })
  async deleteSupplier(@Request() req: any, @Param('id') id: string) {
    return this.suppliersService.deleteSupplier(req.user.organizationId, id);
  }
}
