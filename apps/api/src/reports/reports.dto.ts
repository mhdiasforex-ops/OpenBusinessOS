import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportFormat {
  PDF = 'PDF',
  XLSX = 'XLSX',
  CSV = 'CSV',
  JSON = 'JSON',
}

export enum ReportSchedule {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ONCE = 'ONCE',
}

export class CreateReportDto {
  @ApiProperty({ description: 'Nome do relatório', example: 'Relatório de Vendas Mensal' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Descrição do relatório', example: 'Resumo de vendas do mês anterior' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo do relatório',
    enum: ['sales', 'financial', 'inventory', 'customers', 'appointments'],
    example: 'sales',
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    description: 'Configuração do relatório (filtros, parâmetros, etc.)',
    example: { dateRange: 'last_month', groupBy: 'category' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Formato de saída do relatório',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({
    description: 'Agendamento de execução do relatório',
    enum: ReportSchedule,
    example: ReportSchedule.MONTHLY,
  })
  @IsOptional()
  @IsEnum(ReportSchedule)
  schedule?: ReportSchedule;
}

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Nome do relatório', example: 'Relatório de Vendas Semanal' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do relatório' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tipo do relatório',
    enum: ['sales', 'financial', 'inventory', 'customers', 'appointments'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Configuração do relatório' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Formato de saída do relatório', enum: ReportFormat })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'Agendamento de execução do relatório', enum: ReportSchedule })
  @IsOptional()
  @IsEnum(ReportSchedule)
  schedule?: ReportSchedule;

  @ApiPropertyOptional({ description: 'Se o relatório está ativo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReportListQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de relatório',
    enum: ['sales', 'financial', 'inventory', 'customers', 'appointments'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status ativo', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Página (mínimo 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página (1-100)', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}
