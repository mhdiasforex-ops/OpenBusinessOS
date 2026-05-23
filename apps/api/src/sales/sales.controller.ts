import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateOrderDto, UpdateOrderDto, OrderListQueryDto, UpdateOrderStatusDto } from './sales.dto';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtGuard, PermissionsGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post('orders')
  @Permissions('sales:manage')
  @ApiOperation({ summary: 'Criar pedido/orçamento/proposta' })
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.salesService.createOrder(req.user.organizationId, dto, req.user.id);
  }

  @Get('orders')
  @Permissions('sales:read')
  @ApiOperation({ summary: 'Listar pedidos com filtros e paginação' })
  async getOrders(@Request() req: any, @Query() query: OrderListQueryDto) {
    return this.salesService.getOrders(req.user.organizationId, query);
  }

  @Get('orders/summary')
  @Permissions('sales:read')
  @ApiOperation({ summary: 'Resumo de vendas (total vendido, pedidos por status, ticket médio)' })
  async getSalesSummary(@Request() req: any) {
    return this.salesService.getSalesSummary(req.user.organizationId);
  }

  @Get('orders/customer/:customerId')
  @Permissions('sales:read')
  @ApiOperation({ summary: 'Listar pedidos de um cliente' })
  async getOrdersByCustomer(@Request() req: any, @Param('customerId') customerId: string) {
    return this.salesService.getOrdersByCustomer(req.user.organizationId, customerId);
  }

  @Get('orders/:id')
  @Permissions('sales:read')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  async getOrder(@Request() req: any, @Param('id') id: string) {
    return this.salesService.getOrder(req.user.organizationId, id);
  }

  @Patch('orders/:id')
  @Permissions('sales:manage')
  @ApiOperation({ summary: 'Atualizar pedido' })
  async updateOrder(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.salesService.updateOrder(req.user.organizationId, id, dto);
  }

  @Patch('orders/:id/status')
  @Permissions('sales:manage')
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  async updateOrderStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.salesService.updateOrderStatus(req.user.organizationId, id, dto.status, req.user.id);
  }

  @Delete('orders/:id')
  @Permissions('sales:manage')
  @ApiOperation({ summary: 'Remover pedido' })
  async deleteOrder(@Request() req: any, @Param('id') id: string) {
    return this.salesService.deleteOrder(req.user.organizationId, id);
  }
}
