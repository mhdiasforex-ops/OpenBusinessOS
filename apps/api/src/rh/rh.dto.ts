import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- Employee ---

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Nome do colaborador', example: 'João Silva' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Email do colaborador', example: 'joao@empresa.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'CPF do colaborador', example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ description: 'Cargo', example: 'Desenvolvedor' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Departamento', example: 'Tecnologia' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Data de admissão', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ description: 'Salário', example: 5000 })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({ description: 'Status', enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'], example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'])
  status?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Nome do colaborador' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional() @IsString() email?: string;

  @ApiPropertyOptional({ description: 'CPF' })
  @IsOptional() @IsString() document?: string;

  @ApiPropertyOptional({ description: 'Cargo' })
  @IsOptional() @IsString() position?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @IsOptional() @IsString() department?: string;

  @ApiPropertyOptional({ description: 'Data de admissão' })
  @IsOptional() @IsDateString() hireDate?: string;

  @ApiPropertyOptional({ description: 'Salário' })
  @IsOptional() @IsNumber() salary?: number;

  @ApiPropertyOptional({ description: 'Status', enum: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE'] })
  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE']) status?: string;

  @ApiPropertyOptional({ description: 'Metadados' })
  @IsOptional() @IsObject() metadata?: Record<string, any>;
}

// --- Time Entry ---

export class CreateTimeEntryDto {
  @ApiProperty({ description: 'Data', example: '2024-06-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Horário de entrada', example: '2024-06-15T08:00:00Z' })
  @IsDateString()
  clockIn!: string;

  @ApiPropertyOptional({ description: 'Horário de saída', example: '2024-06-15T17:00:00Z' })
  @IsOptional() @IsDateString() clockOut?: string;

  @ApiPropertyOptional({ description: 'Minutos de intervalo', example: 60 })
  @IsOptional() @IsNumber() @Min(0) breakMinutes?: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional() @IsString() notes?: string;
}

// --- Payroll ---

export class CreatePayrollDto {
  @ApiProperty({ description: 'Mês', example: 6 })
  @IsNumber() @Min(1) @Max(12) month!: number;

  @ApiProperty({ description: 'Ano', example: 2024 })
  @IsNumber() @Min(2020) year!: number;

  @ApiProperty({ description: 'Salário base', example: 5000 })
  @IsNumber() baseSalary!: number;

  @ApiPropertyOptional({ description: 'Adições', example: 500 })
  @IsOptional() @IsNumber() additions?: number;

  @ApiPropertyOptional({ description: 'Descontos', example: 200 })
  @IsOptional() @IsNumber() deductions?: number;

  @ApiPropertyOptional({ description: 'Líquido', example: 5300 })
  @IsOptional() @IsNumber() netPay?: number;

  @ApiPropertyOptional({ description: 'Metadados' })
  @IsOptional() @IsObject() metadata?: Record<string, any>;
}

// --- Leave Request ---

export class CreateLeaveRequestDto {
  @ApiProperty({ description: 'Tipo', enum: ['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER'], example: 'VACATION' })
  @IsEnum(['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER'])
  type!: string;

  @ApiProperty({ description: 'Data início', example: '2024-07-01' })
  @IsDateString() startDate!: string;

  @ApiProperty({ description: 'Data fim', example: '2024-07-15' })
  @IsDateString() endDate!: string;

  @ApiProperty({ description: 'Quantidade de dias', example: 15 })
  @IsNumber() @Min(1) days!: number;

  @ApiPropertyOptional({ description: 'Motivo' })
  @IsOptional() @IsString() reason?: string;
}
