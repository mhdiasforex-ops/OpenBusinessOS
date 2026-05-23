import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Public, CurrentUser } from '../common/guards';
import {
  CreateCmsPageDto,
  UpdateCmsPageDto,
  CreateCmsBlockDto,
  UpdateCmsBlockDto,
  CreateCmsMediaDto,
} from './cms.dto';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  // ─── Pages (Públicos: GET, Protegidos: POST/PUT/DELETE) ───────────

  @Public()
  @Get('pages')
  @ApiOperation({ summary: 'Listar páginas CMS (público)' })
  @ApiQuery({ name: 'niche', required: false, description: 'Filtrar por nicho, ex: RETAIL' })
  async listPages(@Query('niche') niche?: string) {
    return this.cmsService.listPages(niche);
  }

  @Public()
  @Get('pages/:slug')
  @ApiOperation({ summary: 'Buscar página CMS por slug (público)' })
  async getPageBySlug(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
  }

  @Post('pages')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar página CMS' })
  async createPage(@Body() dto: CreateCmsPageDto, @CurrentUser() user: any) {
    const organizationId = user?.organizationId ?? user?.orgId;
    return this.cmsService.createPage(dto, organizationId);
  }

  @Put('pages/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar página CMS' })
  async updatePage(@Param('id') id: string, @Body() dto: UpdateCmsPageDto) {
    return this.cmsService.updatePage(id, dto);
  }

  @Delete('pages/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover página CMS' })
  async deletePage(@Param('id') id: string) {
    return this.cmsService.deletePage(id);
  }

  // ─── Blocks (Públicos: GET, Protegidos: POST/PUT/DELETE) ──────────

  @Public()
  @Get('blocks')
  @ApiOperation({ summary: 'Listar blocos CMS (público)' })
  @ApiQuery({ name: 'niche', required: false, description: 'Filtrar por nicho, ex: RETAIL' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo, ex: HERO' })
  async listBlocks(
    @Query('niche') niche?: string,
    @Query('type') type?: string,
  ) {
    return this.cmsService.listBlocks(niche, type);
  }

  @Post('blocks')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar bloco CMS' })
  async createBlock(@Body() dto: CreateCmsBlockDto, @CurrentUser() user: any) {
    const organizationId = user?.organizationId ?? user?.orgId;
    return this.cmsService.createBlock(dto, organizationId);
  }

  @Put('blocks/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar bloco CMS' })
  async updateBlock(@Param('id') id: string, @Body() dto: UpdateCmsBlockDto) {
    return this.cmsService.updateBlock(id, dto);
  }

  @Delete('blocks/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover bloco CMS' })
  async deleteBlock(@Param('id') id: string) {
    return this.cmsService.deleteBlock(id);
  }

  // ─── Media (Protegidos: todos) ────────────────────────────────────

  @Get('media')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mídias CMS' })
  @ApiQuery({ name: 'niche', required: false, description: 'Filtrar por nicho' })
  async listMedia(@Query('niche') niche?: string) {
    return this.cmsService.listMedia(niche);
  }

  @Post('media')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar registro de mídia CMS' })
  async createMedia(@Body() dto: CreateCmsMediaDto, @CurrentUser() user: any) {
    const organizationId = user?.organizationId ?? user?.orgId;
    return this.cmsService.createMedia(dto, organizationId);
  }

  @Delete('media/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover mídia CMS' })
  async deleteMedia(@Param('id') id: string) {
    return this.cmsService.deleteMedia(id);
  }
}
