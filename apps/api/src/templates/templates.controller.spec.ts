import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplatesController } from './templates.controller';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      getTemplatesByNiche: vi.fn().mockResolvedValue({ items: [] }),
      getTemplatesByNicheAndType: vi.fn().mockResolvedValue({ items: [] }),
      createTemplate: vi.fn().mockResolvedValue({ id: 'tpl-1' }),
      updateTemplate: vi.fn().mockResolvedValue({ id: 'tpl-1' }),
      deleteTemplate: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new TemplatesController(service);
  });

  it('should get templates by niche', async () => {
    const result = await controller.getTemplatesByNiche('RETAIL');
    expect(result).toEqual({ items: [] });
    expect(service.getTemplatesByNiche).toHaveBeenCalledWith('RETAIL');
  });

  it('should get templates by niche and type', async () => {
    const result = await controller.getTemplatesByNicheAndType('RETAIL', 'WORKFLOW');
    expect(result).toEqual({ items: [] });
    expect(service.getTemplatesByNicheAndType).toHaveBeenCalledWith('RETAIL', 'WORKFLOW');
  });

  it('should create template', async () => {
    const dto = { niche: 'RETAIL', type: 'WORKFLOW', name: 'Test' } as any;
    const result = await controller.createTemplate(req, dto);
    expect(result).toEqual({ id: 'tpl-1' });
    expect(service.createTemplate).toHaveBeenCalledWith('org-123', dto);
  });

  it('should update template', async () => {
    const dto = { name: 'Updated' } as any;
    const result = await controller.updateTemplate(req, 'tpl-1', dto);
    expect(result).toEqual({ id: 'tpl-1' });
    expect(service.updateTemplate).toHaveBeenCalledWith('org-123', 'tpl-1', dto);
  });

  it('should delete template', async () => {
    const result = await controller.deleteTemplate(req, 'tpl-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteTemplate).toHaveBeenCalledWith('org-123', 'tpl-1');
  });
});
