import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Niche, CmsPageStatus, CmsBlockType } from '@prisma/client';
import {
  CreateCmsPageDto,
  UpdateCmsPageDto,
  CreateCmsBlockDto,
  UpdateCmsBlockDto,
  CreateCmsMediaDto,
} from './cms.dto';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Pages ────────────────────────────────────────────────────────

  async listPages(niche?: string) {
    const where: any = {};
    if (niche) {
      where.niche = niche as Niche;
    }
    return this.prisma.cmsPage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPageBySlug(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { slug } });
    if (!page) {
      throw new NotFoundException(`Página com slug "${slug}" não encontrada`);
    }
    return page;
  }

  async createPage(data: CreateCmsPageDto, organizationId: string) {
    const page = await this.prisma.cmsPage.create({
      data: {
        organizationId,
        slug: data.slug,
        title: data.title,
        niche: data.niche ? (data.niche as Niche) : undefined,
        content: data.content ?? {},
        meta: data.meta ?? {},
        status: data.status ? (data.status as CmsPageStatus) : CmsPageStatus.DRAFT,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
      },
    });
    this.logger.log(`Page created: ${page.slug}`);
    return page;
  }

  async updatePage(id: string, data: UpdateCmsPageDto) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Página com id "${id}" não encontrada`);
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.niche !== undefined) updateData.niche = data.niche as Niche;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.meta !== undefined) updateData.meta = data.meta;
    if (data.status !== undefined) {
      updateData.status = data.status as CmsPageStatus;
      if (data.status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const page = await this.prisma.cmsPage.update({
      where: { id },
      data: updateData,
    });
    this.logger.log(`Page updated: ${page.slug}`);
    return page;
  }

  async deletePage(id: string) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Página com id "${id}" não encontrada`);
    }
    await this.prisma.cmsPage.delete({ where: { id } });
    this.logger.log(`Page deleted: ${existing.slug}`);
    return { message: 'Página removida com sucesso' };
  }

  // ─── Blocks ───────────────────────────────────────────────────────

  async listBlocks(niche?: string, type?: string) {
    const where: any = {};
    if (niche) {
      where.niche = niche as Niche;
    }
    if (type) {
      where.type = type as CmsBlockType;
    }
    return this.prisma.cmsBlock.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createBlock(data: CreateCmsBlockDto, organizationId: string) {
    const block = await this.prisma.cmsBlock.create({
      data: {
        organizationId,
        key: data.key,
        niche: data.niche ? (data.niche as Niche) : undefined,
        type: data.type as CmsBlockType,
        content: data.content ?? {},
        order: data.order ?? 0,
        status: data.status ? (data.status as CmsPageStatus) : CmsPageStatus.DRAFT,
      },
    });
    this.logger.log(`Block created: ${block.key}`);
    return block;
  }

  async updateBlock(id: string, data: UpdateCmsBlockDto) {
    const existing = await this.prisma.cmsBlock.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bloco com id "${id}" não encontrado`);
    }

    const updateData: any = {};
    if (data.key !== undefined) updateData.key = data.key;
    if (data.niche !== undefined) updateData.niche = data.niche as Niche;
    if (data.type !== undefined) updateData.type = data.type as CmsBlockType;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.status !== undefined) updateData.status = data.status as CmsPageStatus;

    const block = await this.prisma.cmsBlock.update({
      where: { id },
      data: updateData,
    });
    this.logger.log(`Block updated: ${block.key}`);
    return block;
  }

  async deleteBlock(id: string) {
    const existing = await this.prisma.cmsBlock.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bloco com id "${id}" não encontrado`);
    }
    await this.prisma.cmsBlock.delete({ where: { id } });
    this.logger.log(`Block deleted: ${existing.key}`);
    return { message: 'Bloco removido com sucesso' };
  }

  // ─── Media ────────────────────────────────────────────────────────

  async listMedia(niche?: string) {
    const where: any = {};
    if (niche) {
      where.niche = niche as Niche;
    }
    return this.prisma.cmsMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMedia(data: CreateCmsMediaDto, organizationId: string) {
    const media = await this.prisma.cmsMedia.create({
      data: {
        organizationId,
        url: data.url,
        alt: data.alt ?? '',
        type: data.type ?? 'image',
        size: data.size ?? 0,
        niche: data.niche ? (data.niche as Niche) : undefined,
      },
    });
    this.logger.log(`Media created: ${media.url}`);
    return media;
  }

  async deleteMedia(id: string) {
    const existing = await this.prisma.cmsMedia.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Mídia com id "${id}" não encontrada`);
    }
    await this.prisma.cmsMedia.delete({ where: { id } });
    this.logger.log(`Media deleted: ${existing.url}`);
    return { message: 'Mídia removida com sucesso' };
  }
}
