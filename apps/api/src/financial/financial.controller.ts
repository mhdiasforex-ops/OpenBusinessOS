import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions, CurrentUser } from '../common/guards/decorators';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CashFlowQueryDto,
  ConciliateDto,
} from './financial.dto';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial')
@UseGuards(JwtGuard, PermissionsGuard)
export class FinancialController {
  constructor(private financialService: FinancialService) {}

  // --- Transactions CRUD ---

  @Post('transactions')
  @Permissions('financial:manage')
  @ApiOperation({ summary: 'Criar transação financeira' })
  @ApiResponse({ status: 201, description: 'Transação criada' })
  async createTransaction(@Request() req: any, @Body() dto: CreateTransactionDto) {
    return this.financialService.createTransaction(req.user.organizationId, dto, req.user.id);
  }

  @Get('transactions')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Listar transações' })
  async getTransactions(@Request() req: any, @Query() filters: any) {
    return this.financialService.getTransactions(req.user.organizationId, filters);
  }

  @Get('transactions/:id')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  async getTransaction(@Request() req: any, @Param('id') id: string) {
    return this.financialService.getTransaction(req.user.organizationId, id);
  }

  @Patch('transactions/:id')
  @Permissions('financial:manage')
  @ApiOperation({ summary: 'Atualizar transação' })
  async updateTransaction(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.financialService.updateTransaction(req.user.organizationId, id, dto, req.user.id);
  }

  @Post('transactions/:id/pay')
  @Permissions('financial:manage')
  @ApiOperation({ summary: 'Marcar transação como paga' })
  async markAsPaid(@Request() req: any, @Param('id') id: string, @Body('paymentMethod') paymentMethod: string) {
    return this.financialService.markAsPaid(req.user.organizationId, id, paymentMethod, req.user.id);
  }

  @Delete('transactions/:id')
  @Permissions('financial:manage')
  @ApiOperation({ summary: 'Remover transação' })
  async deleteTransaction(@Request() req: any, @Param('id') id: string) {
    return this.financialService.deleteTransaction(req.user.organizationId, id);
  }

  // --- Overdue Detection ---

  @Get('overdue')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Detectar transações em atraso' })
  async getOverdue(@Request() req: any) {
    return this.financialService.checkOverdue(req.user.organizationId);
  }

  // --- Cash Flow ---

  @Get('cash-flow')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Fluxo de caixa' })
  async getCashFlow(
    @Request() req: any,
    @Query() query: CashFlowQueryDto,
    @Query('months') months?: number,
  ) {
    if (months) {
      return this.financialService.getCashFlowByMonths(req.user.organizationId, +months);
    }
    return this.financialService.getCashFlow(req.user.organizationId, query);
  }

  // --- CMV ---

  @Get('cmv')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Custo da Mercadoria Vendida' })
  async getCMV(
    @Request() req: any,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.financialService.getCMV(req.user.organizationId, +month, +year);
  }

  // --- DRE ---

  @Get('dre')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Demonstrativo de Resultados' })
  async getDRE(
    @Request() req: any,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.financialService.getDRE(req.user.organizationId, +month, +year);
  }

  @Get('dre/comparison')
  @Permissions('financial:read')
  @ApiOperation({ summary: 'Comparativo de DRE entre meses' })
  async getDREComparison(
    @Request() req: any,
    @Query('months') months: number = 3,
  ) {
    return this.financialService.getDREComparison(req.user.organizationId, +months);
  }

  // --- Conciliação Bancária ---

  @Post('conciliate')
  @Permissions('financial:manage')
  @ApiOperation({ summary: 'Conciliação bancária' })
  async conciliate(@Request() req: any, @Body() dto: ConciliateDto) {
    return this.financialService.conciliate(req.user.organizationId, dto, req.user.id);
  }
}
