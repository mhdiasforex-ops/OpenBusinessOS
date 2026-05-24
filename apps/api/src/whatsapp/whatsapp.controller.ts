import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/guards/decorators';
import { SendMessageDto, CreateTemplateDto, WebhookDto } from './dto/whatsapp.dto';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
@UseGuards(JwtGuard, RolesGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  // ── Conversations ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List conversations with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Request() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.whatsappService.findAll(
      req.user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.whatsappService.findOne(req.user.organizationId, id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send message to conversation' })
  async sendMessage(@Request() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.whatsappService.sendMessage(req.user.organizationId, id, dto.text);
  }

  // ── Templates ────────────────────────────────────────────────────────

  @Post('templates')
  @ApiOperation({ summary: 'Create message template' })
  async createTemplate(@Request() req: any, @Body() dto: CreateTemplateDto) {
    return this.whatsappService.createTemplate(req.user.organizationId, dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List templates' })
  async getTemplates(@Request() req: any) {
    return this.whatsappService.getTemplates(req.user.organizationId);
  }

  // ── Webhook (public, no auth) ────────────────────────────────────────

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook endpoint for receiving messages' })
  async handleWebhook(@Body() payload: WebhookDto) {
    return this.whatsappService.handleWebhook(payload);
  }

  // ── Stats ────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'WhatsApp statistics' })
  async getStats(@Request() req: any) {
    return this.whatsappService.getStats(req.user.organizationId);
  }
}
