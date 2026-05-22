import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionItemDto {
  @ApiProperty({ description: 'ID do produto', example: 'prod_abc123' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Quantidade', example: 2 })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ description: 'Preço unitário', example: 49.90 })
  @IsNumber()
  unitPrice!: number;

  @ApiProperty({ description: 'Total do item', example: 99.80 })
  @IsNumber()
  total!: number;
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Tipo da transação',
    enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
    example: 'INCOME',
  })
  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  type!: string;

  @ApiProperty({ description: 'Categoria da transação', example: 'Vendas' })
  @IsString()
  category!: string;

  @ApiProperty({ description: 'Valor da transação', example: 1500.00 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ description: 'Descrição da transação', example: 'Venda de produto X' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'ID do cliente associado', example: 'cust_abc123' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'Data de vencimento', example: '2026-06-30' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ description: 'Data de pagamento', example: '2026-06-25' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Status da transação',
    enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento',
    enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'OTHER'],
    example: 'PIX',
  })
  @IsOptional()
  @IsEnum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'OTHER'])
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Itens da transação', type: [CreateTransactionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items?: CreateTransactionItemDto[];
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ description: 'Categoria da transação', example: 'Serviços' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Valor da transação', example: 2000.00 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Descrição da transação', example: 'Venda atualizada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento', example: '2026-07-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Data de pagamento', example: '2026-07-25' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Status da transação',
    enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
  })
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento',
    enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'OTHER'])
  paymentMethod?: string;
}

export class CashFlowQueryDto {
  @ApiProperty({ description: 'Data inicial (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Data final (YYYY-MM-DD)', example: '2026-01-31' })
  @IsDateString()
  endDate!: string;
}

export class ConciliateItemDto {
  @ApiProperty({ description: 'ID da transação', example: 'tx_abc123' })
  @IsString()
  transactionId!: string;

  @ApiProperty({ description: 'Data de pagamento efetivo', example: '2026-06-25' })
  @IsDateString()
  paidAt!: string;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'BANK_SLIP', 'CASH', 'OTHER'],
    example: 'BANK_TRANSFER',
  })
  @IsString()
  paymentMethod!: string;

  @ApiPropertyOptional({ description: 'Referência bancária', example: 'COMP-2026-001' })
  @IsOptional()
  @IsString()
  bankReference?: string;
}

export class ConciliateDto {
  @ApiProperty({ description: 'ID único da conciliação', example: 'conc_20260625_001' })
  @IsString()
  conciliationId!: string;

  @ApiProperty({ description: 'Lista de itens a conciliar', type: [ConciliateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConciliateItemDto)
  items!: ConciliateItemDto[];
}
