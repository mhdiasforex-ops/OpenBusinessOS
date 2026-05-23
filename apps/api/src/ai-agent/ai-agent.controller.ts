import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { ChatRequestDto, AgentQueryDto, WorkflowTriggerDto, FeedbackDto } from './ai-agent.dto';

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('chat')
  chat(@Req() req: any, @Body() dto: ChatRequestDto) {
    return this.aiAgentService.chat(req.user.organizationId, dto.message, dto.context, dto.agent);
  }

  @Post('finance/query')
  financeQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.financeQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('fiscal/query')
  fiscalQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.fiscalQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('crm/query')
  crmQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.crmQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('rh/query')
  rhQuery(@Req() req: any, @Body() dto: AgentQueryDto) {
    return this.aiAgentService.rhQuery(req.user.organizationId, dto.query, dto.parameters);
  }

  @Post('workflow/trigger')
  triggerWorkflow(@Req() req: any, @Body() dto: WorkflowTriggerDto) {
    return this.aiAgentService.triggerWorkflow(req.user.organizationId, dto.type, dto.data);
  }

  @Get('agents')
  getAgents() {
    return this.aiAgentService.getAgents();
  }

  @Get('conversations')
  getConversations(@Req() req: any, @Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.aiAgentService.getConversations(req.user.organizationId, +(page ?? '1') || 1, +(perPage ?? '20') || 20);
  }

  @Get('conversations/:id')
  getConversation(@Req() req: any, @Param('id') id: string) {
    return this.aiAgentService.getConversation(req.user.organizationId, id);
  }

  @Post('feedback')
  submitFeedback(@Req() req: any, @Body() dto: FeedbackDto) {
    return this.aiAgentService.submitFeedback(req.user.organizationId, dto.conversationId, dto.rating, dto.comment);
  }
}
