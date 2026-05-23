import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { Public } from '../common/guards';
import { CreateTemplateDto, UpdateTemplateDto } from './templates.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Public()
  @Get(':niche')
  @ApiOperation({ summary: 'Listar templates por nicho (público)' })
  async getTemplatesByNiche(@Param('niche') niche: string) {
    return this.templatesService.getTemplatesByNiche(niche);
  }

  @Public()
  @Get(':niche/:type')
  @ApiOperation({ summary: 'Listar templates por nicho e tipo (público)' })
  async getTemplatesByNicheAndType(
    @Param('niche') niche: string,
    @Param('type') type: string,
  ) {
    return this.templatesService.getTemplatesByNicheAndType(niche, type);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtGuard, PermissionsGuard)
  @Permissions('templates:manage')
  @ApiOperation({ summary: 'Criar template (admin)' })
  async createTemplate(@Request() req: any, @Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(req.user.organizationId, dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, PermissionsGuard)
  @Permissions('templates:manage')
  @ApiOperation({ summary: 'Atualizar template (admin)' })
  async updateTemplate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateTemplate(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, PermissionsGuard)
  @Permissions('templates:manage')
  @ApiOperation({ summary: 'Remover template (admin)' })
  async deleteTemplate(@Request() req: any, @Param('id') id: string) {
    return this.templatesService.deleteTemplate(req.user.organizationId, id);
  }
}
