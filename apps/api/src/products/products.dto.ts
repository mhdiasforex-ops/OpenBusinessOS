import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto', example: 'Consultoria Estratégica' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'SKU do produto', example: 'CONS-001' })
  @IsString()
  sku!: string;

  @ApiPropertyOptional({ description: 'Categoria do produto', example: 'Serviços' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Preço de custo', example: 50.00 })
  @IsNumber()
  costPrice!: number;

  @ApiProperty({ description: 'Preço de venda', example: 150.00 })
  @IsNumber()
  salePrice!: number;

  @ApiPropertyOptional({ description: 'Unidade de medida', example: 'un', enum: ['un', 'h', 'kg', 'l', 'm', 'mês'] })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Quantidade em estoque', example: 100 })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Estoque mínimo para alerta', example: 5 })
  @IsOptional()
  @IsNumber()
  minStock?: number;

  @ApiPropertyOptional({ description: 'Produto ativo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { fornecedor: 'XYZ' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Nome do produto', example: 'Consultoria Premium' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Categoria do produto', example: 'Serviços' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Preço de custo', example: 60.00 })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Preço de venda', example: 180.00 })
  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida', example: 'h' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Quantidade em estoque', example: 150 })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Estoque mínimo para alerta', example: 10 })
  @IsOptional()
  @IsNumber()
  minStock?: number;

  @ApiPropertyOptional({ description: 'Produto ativo', example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { cor: 'azul' } })
  @IsOptional()
  metadata?: Record<string, any>;
}
