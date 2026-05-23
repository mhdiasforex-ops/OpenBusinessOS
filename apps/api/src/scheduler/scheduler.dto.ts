import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const AppointmentStatusEnum = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export class CreateAppointmentDto {
  @ApiPropertyOptional({ description: 'ID do cliente associado', example: 'cust_abc123' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'Título do agendamento', example: 'Consulta inicial' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Descrição do agendamento', example: 'Consulta de rotina com Dr. Silva' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Status do agendamento',
    enum: AppointmentStatusEnum,
    example: 'SCHEDULED',
    default: 'SCHEDULED',
  })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: string;

  @ApiProperty({ description: 'Data/hora de início (ISO 8601)', example: '2026-06-01T09:00:00Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'Data/hora de término (ISO 8601)', example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ description: 'Local do agendamento', example: 'Sala 3' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais (JSON)', example: { serviceType: 'consulta' } })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'ID do cliente associado', example: 'cust_abc123' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Título do agendamento', example: 'Retorno' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Descrição do agendamento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status do agendamento',
    enum: AppointmentStatusEnum,
  })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: string;

  @ApiPropertyOptional({ description: 'Data/hora de início (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Data/hora de término (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: 'Local do agendamento' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais (JSON)' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AppointmentPeriodQueryDto {
  @ApiProperty({ description: 'Data inicial (YYYY-MM-DD)', example: '2026-06-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Data final (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: AppointmentStatusEnum,
  })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: string;

  @ApiPropertyOptional({ description: 'ID do cliente para filtrar', example: 'cust_abc123' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class AppointmentListQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: AppointmentStatusEnum,
  })
  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: string;

  @ApiPropertyOptional({ description: 'ID do cliente para filtrar', example: 'cust_abc123' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Página (mínimo 1)', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página (1-100)', example: 25, default: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number;
}
