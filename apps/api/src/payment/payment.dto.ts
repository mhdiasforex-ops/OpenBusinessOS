import { IsString, IsOptional, IsEnum, IsInt, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Enums (espelhando Prisma) ──────────────────────────────────────────

export enum PaymentProviderName {
  ASAAS = 'ASAAS',
  MERCADO_PAGO = 'MERCADO_PAGO',
  PAGSEGURO = 'PAGSEGURO',
  STONE = 'STONE',
  PAGHIPER = 'PAGHIPER',
  CIELO = 'CIELO',
  IUGU = 'IUGU',
  ZOOP = 'ZOOP',
  MANUAL = 'MANUAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BANK_SLIP = 'BANK_SLIP',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

// ── Provider Interface Types ───────────────────────────────────────────

export interface CreateChargeInput {
  amount: number;
  method: PaymentMethod;
  customerId?: string;
  description?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
}

export interface CreateChargeResult {
  externalId: string;
  status: PaymentStatus;
  pixCode?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  boletoBarCode?: string;
  fee: number;
  netAmount: number;
}

export interface CheckStatusResult {
  externalId: string;
  status: PaymentStatus;
  paidAt?: Date;
}

export interface CancelChargeResult {
  externalId: string;
  status: PaymentStatus;
}

export interface RefundChargeResult {
  externalId: string;
  status: PaymentStatus;
}

export interface WebhookResult {
  externalId: string;
  status: PaymentStatus;
  paidAt?: Date;
  fee?: number;
}

export interface PaymentProvider {
  createCharge(data: CreateChargeInput): Promise<CreateChargeResult>;
  checkStatus(externalId: string): Promise<CheckStatusResult>;
  cancelCharge(externalId: string): Promise<CancelChargeResult>;
  refundCharge(externalId: string): Promise<RefundChargeResult>;
  processWebhook(payload: any, signature?: string): Promise<WebhookResult>;
}

// ── DTOs ───────────────────────────────────────────────────────────────

export class CreatePaymentConfigDto {
  @ApiProperty({ enum: PaymentProviderName, description: 'Provedor de pagamento' })
  @IsEnum(PaymentProviderName)
  provider!: PaymentProviderName;

  @ApiProperty({ description: 'Chave de API do provedor' })
  @IsString()
  apiKey!: string;

  @ApiPropertyOptional({ description: 'Secret do webhook' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ description: 'Modo sandbox' })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @ApiPropertyOptional({ description: 'Configurações adicionais' })
  @IsOptional()
  settings?: Record<string, any>;
}

export class CreatePaymentDto {
  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ description: 'Valor da cobrança' })
  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento ISO 8601' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryPaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentProviderName })
  @IsOptional()
  @IsEnum(PaymentProviderName)
  provider?: PaymentProviderName;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Data inicial ISO 8601' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final ISO 8601' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
