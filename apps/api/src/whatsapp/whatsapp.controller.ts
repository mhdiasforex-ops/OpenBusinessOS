import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import {
  CreateWhatsAppConfigDto,
  UpdateWhatsAppConfigDto,
  CreateWhatsAppTemplateDto,
  UpdateWhatsAppTemplateDto,
  SendMessageDto,
  MessageFiltersDto,
  TemplateFiltersDto,
  ConfigFiltersDto,
} from './whatsapp.dto';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
@UseGuards(JwtGuard, PermissionsGuard)
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  // ── Config CRUD ───────────────────────────────────────────────────────

  @Post('configs')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Criar configuração WhatsApp' })
  async createConfig(@Request() req: any, @Body() dto: CreateWhatsAppConfigDto) {
    return this.whatsappService.createConfig(req.user.organizationId, dto);
  }

  @Get('configs')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Listar configurações WhatsApp' })
  async getConfigs(@Request() req: any, @Query() filters: ConfigFiltersDto) {
    return this.whatsappService.getConfigs(req.user.organizationId, filters);
  }

  @Get('configs/:id')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Buscar configuração WhatsApp por ID' })
  async getConfig(@Request() req: any, @Param('id') id: string) {
    return this.whatsappService.getConfig(req.user.organizationId, id);
  }

  @Patch('configs/:id')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Atualizar configuração WhatsApp' })
  async updateConfig(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppConfigDto,
  ) {
    return this.whatsappService.updateConfig(req.user.organizationId, id, dto);
  }

  @Delete('configs/:id')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Remover configuração WhatsApp' })
  async deleteConfig(@Request() req: any, @Param('id') id: string) {
    return this.whatsappService.deleteConfig(req.user.organizationId, id);
  }

  // ── Template CRUD ─────────────────────────────────────────────────────

  @Post('templates')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Criar template WhatsApp' })
  async createTemplate(@Request() req: any, @Body() dto: CreateWhatsAppTemplateDto) {
    return this.whatsappService.createTemplate(req.user.organizationId, dto);
  }

  @Get('templates')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Listar templates WhatsApp' })
  async getTemplates(@Request() req: any, @Query() filters: TemplateFiltersDto) {
    return this.whatsappService.getTemplates(req.user.organizationId, filters);
  }

  @Get('templates/:id')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Buscar template WhatsApp por ID' })
  async getTemplate(@Request() req: any, @Param('id') id: string) {
    return this.whatsappService.getTemplate(req.user.organizationId, id);
  }

  @Patch('templates/:id')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Atualizar template WhatsApp' })
  async updateTemplate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppTemplateDto,
  ) {
    return this.whatsappService.updateTemplate(req.user.organizationId, id, dto);
  }

  @Delete('templates/:id')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Remover template WhatsApp' })
  async deleteTemplate(@Request() req: any, @Param('id') id: string) {
    return this.whatsappService.deleteTemplate(req.user.organizationId, id);
  }

  // ── Sync Templates ───────────────────────────────────────────────────

  @Post('configs/:configId/sync-templates')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Sincronizar templates do provedor' })
  async syncTemplates(@Request() req: any, @Param('configId') configId: string) {
    return this.whatsappService.syncTemplates(req.user.organizationId, configId);
  }

  // ── Messages ──────────────────────────────────────────────────────────

  @Post('messages')
  @Permissions('whatsapp:send')
  @ApiOperation({ summary: 'Enviar mensagem WhatsApp' })
  async sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.whatsappService.sendMessage(req.user.organizationId, dto);
  }

  @Get('messages')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Listar mensagens WhatsApp' })
  async getMessages(@Request() req: any, @Query() filters: MessageFiltersDto) {
    return this.whatsappService.getMessages(req.user.organizationId, filters);
  }

  @Get('messages/:id')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Buscar mensagem WhatsApp por ID' })
  async getMessage(@Request() req: any, @Param('id') id: string) {
    return this.whatsappService.getMessage(req.user.organizationId, id);
  }

  // ── Webhook ───────────────────────────────────────────────────────────

  @Post('configs/:configId/webhook')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Receber webhook do provedor WhatsApp' })
  async handleWebhook(
    @Request() req: any,
    @Param('configId') configId: string,
    @Body() payload: any,
  ) {
    return this.whatsappService.handleWebhook(req.user.organizationId, configId, payload);
  }

  // ── Instance Management ───────────────────────────────────────────────

  @Post('configs/:configId/connect')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Conectar instância WhatsApp' })
  async connectInstance(@Request() req: any, @Param('configId') configId: string) {
    return this.whatsappService.connectInstance(req.user.organizationId, configId);
  }

  @Post('configs/:configId/disconnect')
  @Permissions('whatsapp:manage')
  @ApiOperation({ summary: 'Desconectar instância WhatsApp' })
  async disconnectInstance(@Request() req: any, @Param('configId') configId: string) {
    return this.whatsappService.disconnectInstance(req.user.organizationId, configId);
  }

  @Get('configs/:configId/status')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Verificar status da instância WhatsApp' })
  async getInstanceStatus(@Request() req: any, @Param('configId') configId: string) {
    return this.whatsappService.getInstanceStatus(req.user.organizationId, configId);
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  @Get('stats')
  @Permissions('whatsapp:read')
  @ApiOperation({ summary: 'Estatísticas do WhatsApp' })
  async getStats(@Request() req: any) {
    return this.whatsappService.getStats(req.user.organizationId);
  }
}
