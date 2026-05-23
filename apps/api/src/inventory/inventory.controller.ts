import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import {
  CreateStockMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
} from './inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtGuard, PermissionsGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // ── Stock Movements ─────────────────────────────────────────────────

  @Post('movements')
  @Permissions('inventory:manage')
  @ApiOperation({ summary: 'Registrar movimentação de estoque' })
  async createMovement(@Request() req: any, @Body() dto: CreateStockMovementDto) {
    return this.inventoryService.createMovement(req.user.organizationId, dto, req.user.id);
  }

  @Get('movements')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Listar movimentações de estoque' })
  async getMovements(@Request() req: any, @Query() filters: any) {
    return this.inventoryService.getMovements(req.user.organizationId, filters);
  }

  @Get('low-stock')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Produtos com estoque baixo' })
  async getLowStock(@Request() req: any) {
    return this.inventoryService.getLowStock(req.user.organizationId);
  }

  // ── Suppliers ───────────────────────────────────────────────────────

  @Post('suppliers')
  @Permissions('inventory:manage')
  @ApiOperation({ summary: 'Criar fornecedor' })
  async createSupplier(@Request() req: any, @Body() dto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(req.user.organizationId, dto);
  }

  @Get('suppliers')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Listar fornecedores' })
  async getSuppliers(@Request() req: any, @Query() filters: any) {
    return this.inventoryService.getSuppliers(req.user.organizationId, filters);
  }

  @Get('suppliers/:id')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  async getSupplier(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.getSupplier(req.user.organizationId, id);
  }

  @Patch('suppliers/:id')
  @Permissions('inventory:manage')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  async updateSupplier(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.inventoryService.updateSupplier(req.user.organizationId, id, dto);
  }

  @Delete('suppliers/:id')
  @Permissions('inventory:manage')
  @ApiOperation({ summary: 'Remover fornecedor' })
  async deleteSupplier(@Request() req: any, @Param('id') id: string) {
    return this.inventoryService.deleteSupplier(req.user.organizationId, id);
  }

  // ── Purchase Orders ─────────────────────────────────────────────────

  @Post('purchase-orders')
  @Permissions('inventory:manage')
  @ApiOperation({ summary: 'Criar pedido de compra' })
  async createPurchaseOrder(@Request() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.inventoryService.createPurchaseOrder(req.user.organizationId, dto);
  }

  @Get('purchase-orders')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  async getPurchaseOrders(@Request() req: any, @Query() filters: any) {
    return this.inventoryService.getPurchaseOrders(req.user.organizationId, filters);
  }

  @Patch('purchase-orders/:id/status')
  @Permissions('inventory:manage')
  @ApiOperation({ summary: 'Atualizar status do pedido de compra' })
  async updatePurchaseOrderStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: string) {
    return this.inventoryService.updatePurchaseOrderStatus(req.user.organizationId, id, status);
  }
}
