import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowStepDto {
  @ApiProperty({ description: 'Ordem de execução do passo', example: 1 })
  @IsNumber()
  order!: number;

  @ApiProperty({
    description: 'Tipo do passo do workflow',
    enum: ['SEND_EMAIL', 'SEND_WHATSAPP', 'CREATE_TASK', 'UPDATE_STATUS', 'WEBHOOK', 'AI_ACTION', 'DELAY', 'CONDITION'],
    example: 'SEND_EMAIL',
  })
  @IsEnum(['SEND_EMAIL', 'SEND_WHATSAPP', 'CREATE_TASK', 'UPDATE_STATUS', 'WEBHOOK', 'AI_ACTION', 'DELAY', 'CONDITION'])
  type!: string;

  @ApiProperty({ description: 'Configuração do passo', example: { to: 'cliente@email.com', template: 'welcome' } })
  @IsObject()
  config!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração de fallback em caso de erro', example: { channel: 'SMS', message: 'Falha no envio' } })
  @IsOptional()
  @IsObject()
  fallback?: Record<string, any>;
}

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Nome do workflow', example: 'Onboarding de Novo Cliente' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Gatilho do workflow', example: 'CUSTOMER_CREATED' })
  @IsString()
  trigger!: string;

  @ApiPropertyOptional({ description: 'Condições para execução', example: { segment: 'VIP', minLtv: 500 } })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Workflow ativo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Passos do workflow', type: [CreateWorkflowStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStepDto)
  steps?: CreateWorkflowStepDto[];
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({ description: 'Nome do workflow', example: 'Follow-up VIP' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Gatilho do workflow', example: 'TRANSACTION_PAID' })
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional({ description: 'Condições para execução', example: { amount: { min: 1000 } } })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Workflow ativo', example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Passos do workflow', type: [CreateWorkflowStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStepDto)
  steps?: CreateWorkflowStepDto[];
}
