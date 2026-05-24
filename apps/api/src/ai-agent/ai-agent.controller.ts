import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatRequestDto, AgentQueryDto, WorkflowTriggerDto, FeedbackDto } from './ai-agent.dto';

@ApiTags('ai-agent')
@ApiBearerAuth()
@Controller('ai-agent')
@UseGuards(JwtGuard)
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  // ──────────────────────────────────────────────
  // CHAT (roteamento inteligente)
  // ──────────────────────────────────────────────

  @Post('chat')
  @ApiOperation({ summary: 'Chat com agente IA (roteamento automático)' })
  @ApiResponse({ status: 201, description: 'Resposta do agente IA' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  chat(@Req() req: any, @Body() dto: ChatRequestDto) {
    return this.aiAgentService.chat(req.user.organizationId, dto.message, dto.context, dto.agent);
  }

  // ──────────────────────────────────────────────
  // SPECIALIZED AGENTS
  // ──────────────────────────────────────────────

  @Post('finance/query')
  @ApiOperation({ summary: 'Consulta ao agente financeiro' })
  @ApiResponse({ status: 201, description: 'Análise financeira do agente IA' })
  financeQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.financeQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('fiscal/query')
  @ApiOperation({ summary: 'Consulta ao agente fiscal' })
  @ApiResponse({ status: 201, description: 'Análise fiscal do agente IA' })
  fiscalQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.fiscalQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('crm/query')
  @ApiOperation({ summary: 'Consulta ao agente CRM' })
  @ApiResponse({ status: 201, description: 'Análise CRM do agente IA' })
  crmQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.crmQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('rh/query')
  @ApiOperation({ summary: 'Consulta ao agente RH' })
  @ApiResponse({ status: 201, description: 'Análise RH do agente IA' })
  rhQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.rhQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  // ──────────────────────────────────────────────
  // WORKFLOW
  // ──────────────────────────────────────────────

  @Post('workflow/trigger')
  @ApiOperation({ summary: 'Disparar workflow automatizado' })
  @ApiResponse({ status: 201, description: 'Workflow iniciado' })
  triggerWorkflow(@Req() req: any, @Body() dto: WorkflowTriggerDto) {
    return this.aiAgentService.triggerWorkflow(req.user.organizationId, dto.type, dto.data);
  }

  // ──────────────────────────────────────────────
  // AGENTS LIST
  // ──────────────────────────────────────────────

  @Get('agents')
  @ApiOperation({ summary: 'Listar agentes disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de agentes IA' })
  getAgents() {
    return this.aiAgentService.getAgents();
  }

  // ──────────────────────────────────────────────
  // CONVERSATIONS
  // ──────────────────────────────────────────────

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversas do agente IA' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Itens por página' })
  @ApiResponse({ status: 200, description: 'Lista paginada de conversas' })
  getConversations(@Req() req: any, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.aiAgentService.getConversations(req.user.organizationId, +(page ?? '1') || 1, +(perPage ?? '20') || 20);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Buscar conversa por ID' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 200, description: 'Detalhes da conversa' })
  getConversation(@Req() req: any, @Param('id') id: string) {
    return this.aiAgentService.getConversation(req.user.organizationId, id);
  }

  // ──────────────────────────────────────────────
  // FEEDBACK
  // ──────────────────────────────────────────────

  @Post('feedback')
  @ApiOperation({ summary: 'Enviar feedback sobre resposta do agente' })
  @ApiResponse({ status: 201, description: 'Feedback registrado' })
  submitFeedback(@Req() req: any, @Body() dto: FeedbackDto) {
    return this.aiAgentService.submitFeedback(req.user.organizationId, dto.conversationId, dto.rating, dto.comment);
  }
}
