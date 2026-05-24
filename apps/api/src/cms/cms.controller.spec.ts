import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmsController } from './cms.controller';

describe('CmsController', () => {
  let controller: CmsController;
  let cmsService: any;

  beforeEach(() => {
    cmsService = {
      listPages: vi.fn().mockResolvedValue([{ slug: 'home', title: 'Home' }]),
      getPageBySlug: vi.fn().mockResolvedValue({ slug: 'home', title: 'Home' }),
      createPage: vi.fn().mockResolvedValue({ id: 'page-1', slug: 'about' }),
      updatePage: vi.fn().mockResolvedValue({ id: 'page-1', title: 'Updated' }),
      deletePage: vi.fn().mockResolvedValue({ success: true }),
      listBlocks: vi.fn().mockResolvedValue([{ id: 'block-1', type: 'HERO' }]),
      createBlock: vi.fn().mockResolvedValue({ id: 'block-2', type: 'FEATURES' }),
      updateBlock: vi.fn().mockResolvedValue({ id: 'block-1', type: 'UPDATED' }),
      deleteBlock: vi.fn().mockResolvedValue({ success: true }),
      listMedia: vi.fn().mockResolvedValue([{ id: 'media-1', url: 'img.jpg' }]),
      createMedia: vi.fn().mockResolvedValue({ id: 'media-2', url: 'new.jpg' }),
      deleteMedia: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new CmsController(cmsService);
  });

  it('should call listPages with niche', async () => {
    const result = await controller.listPages('RETAIL');
    expect(cmsService.listPages).toHaveBeenCalledWith('RETAIL');
    expect(result).toEqual([{ slug: 'home', title: 'Home' }]);
  });

  it('should call listPages without niche', async () => {
    const result = await controller.listPages(undefined);
    expect(cmsService.listPages).toHaveBeenCalledWith(undefined);
    expect(result).toEqual([{ slug: 'home', title: 'Home' }]);
  });

  it('should call getPageBySlug with slug', async () => {
    const result = await controller.getPageBySlug('home');
    expect(cmsService.getPageBySlug).toHaveBeenCalledWith('home');
    expect(result).toEqual({ slug: 'home', title: 'Home' });
  });

  it('should call createPage with dto and organizationId', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const dto = { title: 'About', slug: 'about', content: '<p>About us</p>' };
    const result = await controller.createPage(dto, user);
    expect(cmsService.createPage).toHaveBeenCalledWith(dto, 'org-123');
    expect(result).toEqual({ id: 'page-1', slug: 'about' });
  });

  it('should call updatePage with id and dto', async () => {
    const dto = { title: 'Updated' };
    const result = await controller.updatePage('page-1', dto);
    expect(cmsService.updatePage).toHaveBeenCalledWith('page-1', dto);
    expect(result).toEqual({ id: 'page-1', title: 'Updated' });
  });

  it('should call deletePage with id', async () => {
    const result = await controller.deletePage('page-1');
    expect(cmsService.deletePage).toHaveBeenCalledWith('page-1');
    expect(result).toEqual({ success: true });
  });

  it('should call listBlocks with niche and type', async () => {
    const result = await controller.listBlocks('RETAIL', 'HERO');
    expect(cmsService.listBlocks).toHaveBeenCalledWith('RETAIL', 'HERO');
    expect(result).toEqual([{ id: 'block-1', type: 'HERO' }]);
  });

  it('should call createBlock with dto and organizationId', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const dto = { type: 'FEATURES', content: '<p>Features</p>' };
    const result = await controller.createBlock(dto, user);
    expect(cmsService.createBlock).toHaveBeenCalledWith(dto, 'org-123');
    expect(result).toEqual({ id: 'block-2', type: 'FEATURES' });
  });

  it('should call updateBlock with id and dto', async () => {
    const dto = { type: 'UPDATED' };
    const result = await controller.updateBlock('block-1', dto);
    expect(cmsService.updateBlock).toHaveBeenCalledWith('block-1', dto);
    expect(result).toEqual({ id: 'block-1', type: 'UPDATED' });
  });

  it('should call deleteBlock with id', async () => {
    const result = await controller.deleteBlock('block-1');
    expect(cmsService.deleteBlock).toHaveBeenCalledWith('block-1');
    expect(result).toEqual({ success: true });
  });

  it('should call listMedia with niche', async () => {
    const result = await controller.listMedia('RETAIL');
    expect(cmsService.listMedia).toHaveBeenCalledWith('RETAIL');
    expect(result).toEqual([{ id: 'media-1', url: 'img.jpg' }]);
  });

  it('should call createMedia with dto and organizationId', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const dto = { url: 'new.jpg', alt: 'New image' };
    const result = await controller.createMedia(dto, user);
    expect(cmsService.createMedia).toHaveBeenCalledWith(dto, 'org-123');
    expect(result).toEqual({ id: 'media-2', url: 'new.jpg' });
  });

  it('should call deleteMedia with id', async () => {
    const result = await controller.deleteMedia('media-1');
    expect(cmsService.deleteMedia).toHaveBeenCalledWith('media-1');
    expect(result).toEqual({ success: true });
  });
});
