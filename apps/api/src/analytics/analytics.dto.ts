import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({ description: 'Data inicial (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Data final (YYYY-MM-DD)', example: '2026-01-31' })
  @IsDateString()
  endDate!: string;
}

export class MetricsQueryDto {
  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD)', example: '2026-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Granularidade dos dados',
    enum: ['daily', 'weekly', 'monthly'],
    example: 'monthly',
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  granularity?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoria', example: 'Vendas' })
  @IsOptional()
  @IsString()
  category?: string;
}
