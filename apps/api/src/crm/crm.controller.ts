import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateCustomerDto, UpdateCustomerDto } from './crm.dto';

@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtGuard, PermissionsGuard)
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Post('customers')
  @Permissions('crm:manage')
  @ApiOperation({ summary: 'Criar cliente' })
  async createCustomer(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.crmService.createCustomer(req.user.organizationId, dto);
  }

  @Get('customers')
  @Permissions('crm:read')
  @ApiOperation({ summary: 'Listar clientes' })
  async getCustomers(@Request() req: any, @Query() filters: any) {
    return this.crmService.getCustomers(req.user.organizationId, filters);
  }

  @Get('customers/:id')
  @Permissions('crm:read')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async getCustomer(@Request() req: any, @Param('id') id: string) {
    return this.crmService.getCustomer(req.user.organizationId, id);
  }

  @Patch('customers/:id')
  @Permissions('crm:manage')
  @ApiOperation({ summary: 'Atualizar cliente' })
  async updateCustomer(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.crmService.updateCustomer(req.user.organizationId, id, dto);
  }

  @Delete('customers/:id')
  @Permissions('crm:manage')
  @ApiOperation({ summary: 'Remover cliente' })
  async deleteCustomer(@Request() req: any, @Param('id') id: string) {
    return this.crmService.deleteCustomer(req.user.organizationId, id);
  }

  @Get('customers/:id/ltv')
  @Permissions('crm:read')
  @ApiOperation({ summary: 'Calcular LTV do cliente' })
  async calculateLTV(@Request() req: any, @Param('id') id: string) {
    return this.crmService.calculateLTV(req.user.organizationId, id);
  }

  @Post('segment')
  @Permissions('crm:manage')
  @ApiOperation({ summary: 'Segmentar clientes por RFM' })
  async segmentCustomers(@Request() req: any) {
    return this.crmService.segmentCustomers(req.user.organizationId);
  }
}
