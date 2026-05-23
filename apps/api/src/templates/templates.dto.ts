import { IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Nicho do template', enum: ['RETAIL', 'ECOMMERCE', 'FOOD_SERVICE', 'PROFESSIONAL_SERVICES', 'HEALTH_CARE', 'EDUCATION', 'CONSTRUCTION', 'BEAUTY', 'FITNESS', 'LEGAL', 'ACCOUNTING', 'TECH_SERVICES', 'REAL_ESTATE', 'AUTOMOTIVE', 'AGRICULTURE', 'OTHER'], example: 'RETAIL' })
  @IsString()
  niche!: string;

  @ApiPropertyOptional({ description: 'Subnicho do template', example: 'RETAIL_CLOTHING' })
  @IsOptional()
  @IsString()
  subniche?: string;

  @ApiProperty({ description: 'Tipo do template', enum: ['ONBOARDING', 'WORKFLOW', 'DASHBOARD', 'EMAIL', 'REPORT', 'INVOICE', 'PRODUCT_CATALOG', 'NICHE_SPECIFIC'], example: 'WORKFLOW' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Nome do template', example: 'Workflow de Vendas' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Descrição do template', example: 'Workflow padrão para vendas no varejo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Conteúdo do template (JSON estruturado)', example: { steps: [] } })
  @IsObject()
  content!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Template ativo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Template padrão do nicho', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Nicho do template' })
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiPropertyOptional({ description: 'Subnicho do template' })
  @IsOptional()
  @IsString()
  subniche?: string;

  @ApiPropertyOptional({ description: 'Tipo do template' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Nome do template' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Conteúdo do template (JSON estruturado)' })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Template ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Template padrão do nicho' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
