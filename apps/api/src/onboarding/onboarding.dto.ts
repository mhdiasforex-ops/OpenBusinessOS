import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteOnboardingDto {
  @ApiPropertyOptional({
    description: 'Nicho da empresa',
    enum: ['RETAIL', 'ECOMMERCE', 'SERVICES', 'FOOD', 'PROFESSIONAL', 'CONSTRUCTION', 'HEALTH', 'EDUCATION', 'OTHER'],
    example: 'SERVICES',
  })
  @IsOptional()
  @IsEnum(['RETAIL', 'ECOMMERCE', 'SERVICES', 'FOOD', 'PROFESSIONAL', 'CONSTRUCTION', 'HEALTH', 'EDUCATION', 'OTHER'])
  niche?: string;

  @ApiPropertyOptional({ description: 'Lista de categorias financeiras pré-configuradas', type: [String], example: ['Vendas', 'Serviços', 'Aluguel', 'Salários'] })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Nome do primeiro produto/serviço', example: 'Consultoria' })
  @IsOptional()
  @IsString()
  firstProductName?: string;

  @ApiPropertyOptional({ description: 'SKU do primeiro produto', example: 'CONS-001' })
  @IsOptional()
  @IsString()
  firstProductSku?: string;

  @ApiPropertyOptional({ description: 'Preço de custo do primeiro produto', example: 50.00 })
  @IsOptional()
  @IsNumber()
  firstProductCost?: number;

  @ApiPropertyOptional({ description: 'Preço de venda do primeiro produto', example: 150.00 })
  @IsOptional()
  @IsNumber()
  firstProductSalePrice?: number;

  @ApiPropertyOptional({ description: 'Ativar workflows sugeridos', example: true })
  @IsOptional()
  activateWorkflows?: boolean;

  @ApiPropertyOptional({ description: 'Metadados adicionais do onboarding', example: { fonte: 'google' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
