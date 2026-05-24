import { IsString, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'Mensagem do usuário para o agente IA', example: 'Qual o faturamento deste mês?' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Contexto adicional para o agente', example: 'Relatório mensal de vendas' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({
    description: 'Agente específico (orchestrator, finance, fiscal, crm, rh)',
    enum: ['orchestrator', 'finance', 'fiscal', 'crm', 'rh'],
    example: 'finance',
  })
  @IsOptional()
  @IsString()
  agent?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { userId: 'clx123', sessionId: 'abc456' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AgentQueryDto {
  @ApiProperty({ description: 'Consulta ao agente especializado', example: 'Resumo de contas a pagar vencidas' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Parâmetros adicionais para a consulta', example: { periodo: '2026-05', status: 'vencido' } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Período de referência', example: '2026-05' })
  @IsOptional()
  @IsString()
  timeframe?: string;
}

export class WorkflowTriggerDto {
  @ApiProperty({
    description: 'Tipo do workflow a disparar',
    example: 'gerar-relatorio-financeiro',
    enum: ['gerar-relatorio-financeiro', 'enviar-cobranca', 'backup-dados', 'sincronizar-nfe', 'notificar-vencimento'],
  })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Dados de entrada do workflow', example: { periodo: '2026-05', formato: 'pdf' } })
  @IsObject()
  data!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Agendamento (cron ou ISO date)', example: '0 8 * * *' })
  @IsOptional()
  @IsString()
  schedule?: string;
}

export class FeedbackDto {
  @ApiProperty({ description: 'ID da conversa', example: 'conv-clx123abc' })
  @IsString()
  conversationId!: string;

  @ApiProperty({ description: 'Avaliação de 1 a 5 estrelas', example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Comentário do feedback', example: 'Resposta útil, mas poderia ser mais detalhada' })
  @IsOptional()
  @IsString()
  comment?: string;
}
