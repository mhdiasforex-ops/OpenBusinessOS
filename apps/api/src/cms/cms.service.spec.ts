import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmsService } from './cms.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateCmsPageDto, UpdateCmsPageDto, CreateCmsBlockDto, UpdateCmsBlockDto, CreateCmsMediaDto } from './cms.dto';

describe('CmsService', () => {
  let service: CmsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      cmsPage: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      cmsBlock: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      cmsMedia: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new CmsService(prisma as unknown as PrismaService);
  });

  const orgId = 'org-123';

  // ── Pages ──────────────────────────────────────────────────────────

  describe('listPages', () => {
    it('should return all pages ordered by createdAt desc', async () => {
      const pages = [{ id: 'p1', slug: 'page-1' }, { id: 'p2', slug: 'page-2' }];
      prisma.cmsPage.findMany.mockResolvedValue(pages);

      const result = await service.listPages();

      expect(result).toEqual(pages);
      expect(prisma.cmsPage.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by niche when provided', async () => {
      prisma.cmsPage.findMany.mockResolvedValue([]);

      await service.listPages('RETAIL');

      const call = prisma.cmsPage.findMany.mock.calls[0][0];
      expect(call.where.niche).toBe('RETAIL');
    });

    it('should not filter by niche when undefined', async () => {
      prisma.cmsPage.findMany.mockResolvedValue([]);

      await service.listPages(undefined);

      const call = prisma.cmsPage.findMany.mock.calls[0][0];
      expect(call.where.niche).toBeUndefined();
    });
  });

  describe('getPageBySlug', () => {
    it('should return page when slug exists', async () => {
      const page = { id: 'p1', slug: 'my-slug', title: 'My Page' };
      prisma.cmsPage.findUnique.mockResolvedValue(page);

      const result = await service.getPageBySlug('my-slug');

      expect(result).toEqual(page);
      expect(prisma.cmsPage.findUnique).toHaveBeenCalledWith({ where: { slug: 'my-slug' } });
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(null);

      await expect(service.getPageBySlug('missing-slug')).rejects.toThrow(NotFoundException);
      await expect(service.getPageBySlug('missing-slug')).rejects.toThrow(/não encontrada/);
    });
  });

  describe('createPage', () => {
    const dto: CreateCmsPageDto = {
      slug: 'varejo-landing',
      title: 'BusinessOS para Varejo',
      niche: 'RETAIL',
      content: { sections: [] },
      meta: { description: 'Página do varejo' },
      status: 'DRAFT',
    };

    it('should create a page with all fields', async () => {
      const created = { id: 'page-1', organizationId: orgId, ...dto, publishedAt: null };
      prisma.cmsPage.create.mockResolvedValue(created);

      const result = await service.createPage(dto, orgId);

      expect(prisma.cmsPage.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          slug: dto.slug,
          title: dto.title,
          niche: 'RETAIL',
          content: dto.content,
          meta: dto.meta,
          status: 'DRAFT',
          publishedAt: undefined,
        },
      });
      expect(result).toEqual(created);
    });

    it('should set publishedAt when status is PUBLISHED', async () => {
      const publishDto: CreateCmsPageDto = { ...dto, status: 'PUBLISHED' };
      const before = Date.now();
      prisma.cmsPage.create.mockResolvedValue({ id: 'page-1', slug: 'published-page' });

      await service.createPage(publishDto, orgId);

      const call = prisma.cmsPage.create.mock.calls[0][0];
      expect(call.data.publishedAt).toBeInstanceOf(Date);
      expect(call.data.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('should default content and meta to empty objects', async () => {
      const minimalDto: CreateCmsPageDto = { slug: 'minimal', title: 'Minimal' };
      prisma.cmsPage.create.mockResolvedValue({ id: 'page-1' });

      await service.createPage(minimalDto, orgId);

      const call = prisma.cmsPage.create.mock.calls[0][0];
      expect(call.data.content).toEqual({});
      expect(call.data.meta).toEqual({});
    });

    it('should default status to DRAFT', async () => {
      const noStatusDto: CreateCmsPageDto = { slug: 'no-status', title: 'No Status' };
      prisma.cmsPage.create.mockResolvedValue({ id: 'page-1' });

      await service.createPage(noStatusDto, orgId);

      const call = prisma.cmsPage.create.mock.calls[0][0];
      expect(call.data.status).toBe('DRAFT');
      expect(call.data.publishedAt).toBeUndefined();
    });

    it('should handle missing niche', async () => {
      const noNicheDto: CreateCmsPageDto = { slug: 'no-niche', title: 'No Niche' };
      prisma.cmsPage.create.mockResolvedValue({ id: 'page-1' });

      await service.createPage(noNicheDto, orgId);

      const call = prisma.cmsPage.create.mock.calls[0][0];
      expect(call.data.niche).toBeUndefined();
    });
  });

  describe('updatePage', () => {
    const existingPage = {
      id: 'page-1',
      slug: 'my-page',
      title: 'Original',
      niche: 'RETAIL',
      content: { old: true },
      meta: { desc: 'old' },
      status: 'DRAFT',
      publishedAt: null,
    };

    it('should throw NotFoundException when page does not exist', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(null);

      await expect(service.updatePage('missing-id', {} as UpdateCmsPageDto)).rejects.toThrow(NotFoundException);
    });

    it('should update title only', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(existingPage);
      prisma.cmsPage.update.mockResolvedValue({ ...existingPage, title: 'Updated Title' });

      await service.updatePage('page-1', { title: 'Updated Title' });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data).toEqual({ title: 'Updated Title' });
    });

    it('should update niche only', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(existingPage);
      prisma.cmsPage.update.mockResolvedValue({ ...existingPage, niche: 'ECOMMERCE' });

      await service.updatePage('page-1', { niche: 'ECOMMERCE' });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data).toEqual({ niche: 'ECOMMERCE' });
    });

    it('should update content only', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(existingPage);
      prisma.cmsPage.update.mockResolvedValue({ ...existingPage, content: { new: true } });

      await service.updatePage('page-1', { content: { new: true } });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data).toEqual({ content: { new: true } });
    });

    it('should update meta only', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(existingPage);
      prisma.cmsPage.update.mockResolvedValue({ ...existingPage, meta: { new: 'meta' } });

      await service.updatePage('page-1', { meta: { new: 'meta' } });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data).toEqual({ meta: { new: 'meta' } });
    });

    it('should set publishedAt on first publish', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(existingPage);
      prisma.cmsPage.update.mockResolvedValue({ ...existingPage, status: 'PUBLISHED', publishedAt: new Date() });
      const before = Date.now();

      await service.updatePage('page-1', { status: 'PUBLISHED' });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data.status).toBe('PUBLISHED');
      expect(call.data.publishedAt).toBeInstanceOf(Date);
      expect(call.data.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('should not set publishedAt if already published', async () => {
      const alreadyPublished = { ...existingPage, status: 'PUBLISHED', publishedAt: new Date('2024-01-01') };
      prisma.cmsPage.findUnique.mockResolvedValue(alreadyPublished);
      prisma.cmsPage.update.mockResolvedValue(alreadyPublished);

      await service.updatePage('page-1', { status: 'PUBLISHED' });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data.publishedAt).toBeUndefined();
    });

    it('should handle status change to non-PUBLISHED', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(existingPage);
      prisma.cmsPage.update.mockResolvedValue({ ...existingPage, status: 'DRAFT' });

      await service.updatePage('page-1', { status: 'DRAFT' });

      const call = prisma.cmsPage.update.mock.calls[0][0];
      expect(call.data.status).toBe('DRAFT');
      expect(call.data.publishedAt).toBeUndefined();
    });
  });

  describe('deletePage', () => {
    it('should delete existing page and return success message', async () => {
      const existing = { id: 'page-1', slug: 'my-page' };
      prisma.cmsPage.findUnique.mockResolvedValue(existing);
      prisma.cmsPage.delete.mockResolvedValue(existing);

      const result = await service.deletePage('page-1');

      expect(prisma.cmsPage.delete).toHaveBeenCalledWith({ where: { id: 'page-1' } });
      expect(result).toEqual({ message: expect.stringContaining('sucesso') });
    });

    it('should throw NotFoundException when page does not exist', async () => {
      prisma.cmsPage.findUnique.mockResolvedValue(null);

      await expect(service.deletePage('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Blocks ─────────────────────────────────────────────────────────

  describe('listBlocks', () => {
    it('should return all blocks ordered by order asc, createdAt desc', async () => {
      const blocks = [{ id: 'b1', key: 'hero' }, { id: 'b2', key: 'features' }];
      prisma.cmsBlock.findMany.mockResolvedValue(blocks);

      const result = await service.listBlocks();

      expect(result).toEqual(blocks);
      expect(prisma.cmsBlock.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter by niche', async () => {
      prisma.cmsBlock.findMany.mockResolvedValue([]);

      await service.listBlocks('RETAIL');

      const call = prisma.cmsBlock.findMany.mock.calls[0][0];
      expect(call.where.niche).toBe('RETAIL');
    });

    it('should filter by type', async () => {
      prisma.cmsBlock.findMany.mockResolvedValue([]);

      await service.listBlocks(undefined, 'HERO');

      const call = prisma.cmsBlock.findMany.mock.calls[0][0];
      expect(call.where.type).toBe('HERO');
    });

    it('should filter by both niche and type', async () => {
      prisma.cmsBlock.findMany.mockResolvedValue([]);

      await service.listBlocks('RETAIL', 'HERO');

      const call = prisma.cmsBlock.findMany.mock.calls[0][0];
      expect(call.where.niche).toBe('RETAIL');
      expect(call.where.type).toBe('HERO');
    });
  });

  describe('createBlock', () => {
    const dto: CreateCmsBlockDto = {
      key: 'varejo-hero',
      niche: 'RETAIL',
      type: 'HERO',
      content: { title: 'Varejo' },
      order: 1,
      status: 'PUBLISHED',
    };

    it('should create a block with all fields', async () => {
      const created = { id: 'block-1', organizationId: orgId, ...dto };
      prisma.cmsBlock.create.mockResolvedValue(created);

      const result = await service.createBlock(dto, orgId);

      expect(prisma.cmsBlock.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          key: dto.key,
          niche: 'RETAIL',
          type: 'HERO',
          content: dto.content,
          order: 1,
          status: 'PUBLISHED',
        },
      });
      expect(result).toEqual(created);
    });

    it('should apply defaults for missing fields', async () => {
      const minimalDto: CreateCmsBlockDto = { key: 'minimal', type: 'FEATURE' };
      prisma.cmsBlock.create.mockResolvedValue({ id: 'block-1' });

      await service.createBlock(minimalDto, orgId);

      const call = prisma.cmsBlock.create.mock.calls[0][0];
      expect(call.data.niche).toBeUndefined();
      expect(call.data.content).toEqual({});
      expect(call.data.order).toBe(0);
      expect(call.data.status).toBe('DRAFT');
    });
  });

  describe('updateBlock', () => {
    const existingBlock = { id: 'block-1', key: 'hero', niche: 'RETAIL', type: 'HERO', content: {}, order: 1, status: 'DRAFT' };

    it('should throw NotFoundException when block does not exist', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(null);

      await expect(service.updateBlock('missing-id', {} as UpdateCmsBlockDto)).rejects.toThrow(NotFoundException);
    });

    it('should update key', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(existingBlock);
      prisma.cmsBlock.update.mockResolvedValue({ ...existingBlock, key: 'new-key' });

      await service.updateBlock('block-1', { key: 'new-key' });

      const call = prisma.cmsBlock.update.mock.calls[0][0];
      expect(call.data.key).toBe('new-key');
    });

    it('should update niche', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(existingBlock);
      prisma.cmsBlock.update.mockResolvedValue({ ...existingBlock, niche: 'ECOMMERCE' });

      await service.updateBlock('block-1', { niche: 'ECOMMERCE' });

      const call = prisma.cmsBlock.update.mock.calls[0][0];
      expect(call.data.niche).toBe('ECOMMERCE');
    });

    it('should update type', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(existingBlock);
      prisma.cmsBlock.update.mockResolvedValue({ ...existingBlock, type: 'CTA' });

      await service.updateBlock('block-1', { type: 'CTA' });

      const call = prisma.cmsBlock.update.mock.calls[0][0];
      expect(call.data.type).toBe('CTA');
    });

    it('should update content', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(existingBlock);
      prisma.cmsBlock.update.mockResolvedValue({ ...existingBlock, content: { new: 'content' } });

      await service.updateBlock('block-1', { content: { new: 'content' } });

      const call = prisma.cmsBlock.update.mock.calls[0][0];
      expect(call.data.content).toEqual({ new: 'content' });
    });

    it('should update order', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(existingBlock);
      prisma.cmsBlock.update.mockResolvedValue({ ...existingBlock, order: 5 });

      await service.updateBlock('block-1', { order: 5 });

      const call = prisma.cmsBlock.update.mock.calls[0][0];
      expect(call.data.order).toBe(5);
    });

    it('should update status', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(existingBlock);
      prisma.cmsBlock.update.mockResolvedValue({ ...existingBlock, status: 'PUBLISHED' });

      await service.updateBlock('block-1', { status: 'PUBLISHED' });

      const call = prisma.cmsBlock.update.mock.calls[0][0];
      expect(call.data.status).toBe('PUBLISHED');
    });
  });

  describe('deleteBlock', () => {
    it('should delete existing block and return success message', async () => {
      const existing = { id: 'block-1', key: 'hero' };
      prisma.cmsBlock.findUnique.mockResolvedValue(existing);
      prisma.cmsBlock.delete.mockResolvedValue(existing);

      const result = await service.deleteBlock('block-1');

      expect(prisma.cmsBlock.delete).toHaveBeenCalledWith({ where: { id: 'block-1' } });
      expect(result).toEqual({ message: expect.stringContaining('sucesso') });
    });

    it('should throw NotFoundException when block does not exist', async () => {
      prisma.cmsBlock.findUnique.mockResolvedValue(null);

      await expect(service.deleteBlock('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Media ──────────────────────────────────────────────────────────

  describe('listMedia', () => {
    it('should return all media ordered by createdAt desc', async () => {
      const media = [{ id: 'm1', url: 'https://example.com/img.jpg' }];
      prisma.cmsMedia.findMany.mockResolvedValue(media);

      const result = await service.listMedia();

      expect(result).toEqual(media);
      expect(prisma.cmsMedia.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by niche when provided', async () => {
      prisma.cmsMedia.findMany.mockResolvedValue([]);

      await service.listMedia('RETAIL');

      const call = prisma.cmsMedia.findMany.mock.calls[0][0];
      expect(call.where.niche).toBe('RETAIL');
    });
  });

  describe('createMedia', () => {
    const dto: CreateCmsMediaDto = {
      url: 'https://cdn.example.com/hero.jpg',
      alt: 'Hero image',
      type: 'image',
      size: 102400,
      niche: 'RETAIL',
    };

    it('should create media with all fields', async () => {
      const created = { id: 'media-1', organizationId: orgId, ...dto };
      prisma.cmsMedia.create.mockResolvedValue(created);

      const result = await service.createMedia(dto, orgId);

      expect(prisma.cmsMedia.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          url: dto.url,
          alt: 'Hero image',
          type: 'image',
          size: 102400,
          niche: 'RETAIL',
        },
      });
      expect(result).toEqual(created);
    });

    it('should apply defaults for missing fields', async () => {
      const minimalDto: CreateCmsMediaDto = { url: 'https://cdn.example.com/img.jpg' };
      prisma.cmsMedia.create.mockResolvedValue({ id: 'media-1' });

      await service.createMedia(minimalDto, orgId);

      const call = prisma.cmsMedia.create.mock.calls[0][0];
      expect(call.data.alt).toBe('');
      expect(call.data.type).toBe('image');
      expect(call.data.size).toBe(0);
      expect(call.data.niche).toBeUndefined();
    });
  });

  describe('deleteMedia', () => {
    it('should delete existing media and return success message', async () => {
      const existing = { id: 'media-1', url: 'https://cdn.example.com/img.jpg' };
      prisma.cmsMedia.findUnique.mockResolvedValue(existing);
      prisma.cmsMedia.delete.mockResolvedValue(existing);

      const result = await service.deleteMedia('media-1');

      expect(prisma.cmsMedia.delete).toHaveBeenCalledWith({ where: { id: 'media-1' } });
      expect(result).toEqual({ message: expect.stringContaining('sucesso') });
    });

    it('should throw NotFoundException when media does not exist', async () => {
      prisma.cmsMedia.findUnique.mockResolvedValue(null);

      await expect(service.deleteMedia('missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});
