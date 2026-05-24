import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const NotificationTypeValues = ['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'SYSTEM'] as const;

export class NotificationFiltersDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status de leitura (true = lidas, false = não lidas)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  read?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de notificação',
    enum: NotificationTypeValues,
    example: 'INFO',
  })
  @IsOptional()
  @IsEnum(NotificationTypeValues)
  type?: string;

  @ApiPropertyOptional({ description: 'Página (começa em 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', example: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;
}
