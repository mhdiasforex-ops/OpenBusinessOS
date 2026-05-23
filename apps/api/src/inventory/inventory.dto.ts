import { IsString, IsInt, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Stock Movement ──────────────────────────────────────────────────────

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
}

export class CreateStockMovementDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsString()
  productId!: string;

  @ApiProperty({ enum: StockMovementType })
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @ApiProperty({ description: 'Quantidade (positivo)' })
  @IsInt()
  @Type(() => Number)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  costPrice?: number;
}

// ── Supplier ────────────────────────────────────────────────────────────

export class CreateSupplierDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() document?: string;
  @ApiPropertyOptional() @IsOptional() address?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() document?: string;
  @ApiPropertyOptional() @IsOptional() address?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

// ── Purchase Order ──────────────────────────────────────────────────────

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export class PurchaseOrderItemDto {
  @ApiProperty() @IsString() productId!: string;
  @ApiProperty() @IsInt() @Type(() => Number) quantity!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) unitPrice!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsString() supplierId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expectedAt?: string;
  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}
