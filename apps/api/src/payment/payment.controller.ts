import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreatePaymentDto, CreatePaymentConfigDto, QueryPaymentDto } from './payment.dto';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtGuard, PermissionsGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // ── Config ────────────────────────────────────────────────────────

  @Post('configs')
  @Permissions('payment:manage')
  @ApiOperation({ summary: 'Criar configuração de gateway de pagamento' })
  async createConfig(@Request() req: any, @Body() dto: CreatePaymentConfigDto) {
    return this.paymentService.createConfig(req.user.organizationId, dto);
  }

  @Get('configs')
  @Permissions('payment:read')
  @ApiOperation({ summary: 'Listar configurações de pagamento' })
  async getConfigs(@Request() req: any) {
    return this.paymentService.getConfigs(req.user.organizationId);
  }

  @Delete('configs/:id')
  @Permissions('payment:manage')
  @ApiOperation({ summary: 'Remover configuração de pagamento' })
  async deleteConfig(@Request() req: any, @Param('id') id: string) {
    return this.paymentService.deleteConfig(req.user.organizationId, id);
  }

  // ── Payments ──────────────────────────────────────────────────────

  @Post()
  @Permissions('payment:create')
  @ApiOperation({ summary: 'Criar cobrança' })
  async createPayment(@Request() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('payment:read')
  @ApiOperation({ summary: 'Listar pagamentos' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'provider', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async getPayments(@Request() req: any, @Query() query: QueryPaymentDto) {
    return this.paymentService.getPayments(req.user.organizationId, query);
  }

  @Get('stats')
  @Permissions('payment:read')
  @ApiOperation({ summary: 'Estatísticas de pagamentos' })
  async getStats(@Request() req: any) {
    return this.paymentService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @Permissions('payment:read')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  async getPayment(@Request() req: any, @Param('id') id: string) {
    return this.paymentService.getPayment(req.user.organizationId, id);
  }

  @Post(':id/check')
  @Permissions('payment:manage')
  @ApiOperation({ summary: 'Verificar status do pagamento no gateway' })
  async checkStatus(@Request() req: any, @Param('id') id: string) {
    return this.paymentService.checkPaymentStatus(req.user.organizationId, id);
  }

  @Post(':id/cancel')
  @Permissions('payment:manage')
  @ApiOperation({ summary: 'Cancelar cobrança' })
  async cancelPayment(@Request() req: any, @Param('id') id: string) {
    return this.paymentService.cancelPayment(req.user.organizationId, id);
  }

  @Post(':id/refund')
  @Permissions('payment:manage')
  @ApiOperation({ summary: 'Estornar pagamento' })
  async refundPayment(@Request() req: any, @Param('id') id: string) {
    return this.paymentService.refundPayment(req.user.organizationId, id);
  }

  // ── Webhook (público) ─────────────────────────────────────────────

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Webhook de pagamento (público)' })
  async webhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Request() req: any,
  ) {
    const orgId = req.user?.organizationId ?? payload?.organizationId;
    if (!orgId) return { received: true };
    return this.paymentService.processWebhook(orgId, provider, payload);
  }
}
