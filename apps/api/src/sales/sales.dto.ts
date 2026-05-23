import { IsString, IsOptional, IsEnum, IsArray, IsNumber, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// --- Order Item ---

export class OrderItemDto {
  @ApiProperty({ description: 'ID do produto', example: 'clxabc123' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Quantidade', example: 2 })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ description: 'Preço unitário', example: 49.90 })
  @IsNumber()
  unitPrice!: number;

  @ApiProperty({ description: 'Total do item (quantity * unitPrice)', example: 99.80 })
  @IsNumber()
  total!: number;
}

// --- Create Order ---

export class CreateOrderDto {
  @ApiProperty({ description: 'ID do cliente', example: 'clxcustomer123' })
  @IsString()
  customerId!: string;

  @ApiProperty({
    description: 'Tipo do pedido',
    enum: ['SALE', 'QUOTE', 'PROPOSAL'],
    example: 'SALE',
  })
  @IsEnum(['SALE', 'QUOTE', 'PROPOSAL'])
  type!: string;

  @ApiProperty({
    description: 'Itens do pedido',
    type: [OrderItemDto],
    example: [{ productId: 'clxabc123', quantity: 2, unitPrice: 49.9, total: 99.8 }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ description: 'Subtotal do pedido', example: 199.80 })
  @IsNumber()
  subtotal!: number;

  @ApiPropertyOptional({ description: 'Desconto aplicado', example: 20.0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Observações do pedido', example: 'Entregar até sexta' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento', example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

// --- Update Order ---

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'ID do cliente', example: 'clxcustomer456' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Tipo do pedido',
    enum: ['SALE', 'QUOTE', 'PROPOSAL'],
    example: 'QUOTE',
  })
  @IsOptional()
  @IsEnum(['SALE', 'QUOTE', 'PROPOSAL'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Itens do pedido',
    type: [OrderItemDto],
    example: [{ productId: 'clxabc123', quantity: 3, unitPrice: 49.9, total: 149.7 }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Subtotal do pedido', example: 149.70 })
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Desconto aplicado', example: 15.0 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Observações do pedido', example: 'Cliente solicitou alteração' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Data de vencimento', example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

// --- Order List Query ---

export class OrderListQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    example: 'CONFIRMED',
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo',
    enum: ['SALE', 'QUOTE', 'PROPOSAL'],
    example: 'SALE',
  })
  @IsOptional()
  @IsEnum(['SALE', 'QUOTE', 'PROPOSAL'])
  type?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID do cliente', example: 'clxcustomer123' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Página (a partir de 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', example: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  perPage?: number;
}

// --- Update Order Status ---

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Novo status do pedido',
    enum: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    example: 'CONFIRMED',
  })
  @IsEnum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status!: string;
}
