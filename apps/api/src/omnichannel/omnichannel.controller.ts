import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OmnichannelService } from './omnichannel.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import {
  SendWhatsAppDto,
  SendEmailDto,
  SendSmsDto,
  ReplyConversationDto,
  CreateTemplateDto,
} from './omnichannel.dto';

@ApiTags('omnichannel')
@ApiBearerAuth()
@Controller('omnichannel')
@UseGuards(JwtGuard, PermissionsGuard)
export class OmnichannelController {
  constructor(private omnichannelService: OmnichannelService) {}

  // --- WhatsApp ---

  @Post('whatsapp/send')
  @Permissions('omnichannel:manage')
  @ApiOperation({ summary: 'Enviar mensagem WhatsApp' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada' })
  async sendWhatsApp(@Request() req: any, @Body() dto: SendWhatsAppDto) {
    return this.omnichannelService.sendWhatsApp(req.user.organizationId, dto, req.user.id);
  }

  @Post('whatsapp/webhook')
  @ApiOperation({ summary: 'Receber webhook do WhatsApp' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  async receiveWhatsAppWebhook(@Request() req: any, @Body() payload: any) {
    return this.omnichannelService.receiveWhatsAppWebhook(req.user.organizationId, payload);
  }

  // --- Email ---

  @Post('email/send')
  @Permissions('omnichannel:manage')
  @ApiOperation({ summary: 'Enviar email' })
  @ApiResponse({ status: 201, description: 'Email enviado' })
  async sendEmail(@Request() req: any, @Body() dto: SendEmailDto) {
    return this.omnichannelService.sendEmail(req.user.organizationId, dto, req.user.id);
  }

  // --- SMS ---

  @Post('sms/send')
  @Permissions('omnichannel:manage')
  @ApiOperation({ summary: 'Enviar SMS' })
  @ApiResponse({ status: 201, description: 'SMS enviado' })
  async sendSms(@Request() req: any, @Body() dto: SendSmsDto) {
    return this.omnichannelService.sendSms(req.user.organizationId, dto, req.user.id);
  }

  // --- Conversations ---

  @Get('conversations')
  @Permissions('omnichannel:read')
  @ApiOperation({ summary: 'Listar conversas' })
  async getConversations(@Request() req: any, @Query() filters: any) {
    return this.omnichannelService.getConversations(req.user.organizationId, filters);
  }

  @Get('conversations/:id')
  @Permissions('omnichannel:read')
  @ApiOperation({ summary: 'Detalhe de conversa' })
  async getConversation(@Request() req: any, @Param('id') id: string) {
    return this.omnichannelService.getConversation(req.user.organizationId, id);
  }

  @Post('conversations/:id/reply')
  @Permissions('omnichannel:manage')
  @ApiOperation({ summary: 'Responder conversa' })
  @ApiResponse({ status: 201, description: 'Resposta enviada' })
  async replyConversation(@Request() req: any, @Param('id') id: string, @Body() dto: ReplyConversationDto) {
    return this.omnichannelService.replyConversation(req.user.organizationId, id, dto, req.user.id);
  }

  // --- Templates ---

  @Get('templates')
  @Permissions('omnichannel:read')
  @ApiOperation({ summary: 'Listar templates de mensagem' })
  async getTemplates(@Request() req: any, @Query() filters: any) {
    return this.omnichannelService.getTemplates(req.user.organizationId, filters);
  }

  @Post('templates')
  @Permissions('omnichannel:manage')
  @ApiOperation({ summary: 'Criar template de mensagem' })
  @ApiResponse({ status: 201, description: 'Template criado' })
  async createTemplate(@Request() req: any, @Body() dto: CreateTemplateDto) {
    return this.omnichannelService.createTemplate(req.user.organizationId, dto, req.user.id);
  }

  // --- Channel Status ---

  @Get('channels')
  @Permissions('omnichannel:read')
  @ApiOperation({ summary: 'Status dos canais de comunicação' })
  async getChannelStatus(@Request() req: any) {
    return this.omnichannelService.getChannelStatus(req.user.organizationId);
  }
}
