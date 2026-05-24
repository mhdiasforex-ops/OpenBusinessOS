import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplatesService } from './templates.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: any;

  const orgId = 'org-1';

  const mockTemplate = {
    id: 'tmpl-1',
    organizationId: orgId,
    niche: 'RETAIL',
    subniche: null,
    type: 'ONBOARDING',
    name: 'Template Padrão',
    description: 'Descrição',
    content: { blocks: [] },
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      template: {
        findMany: vi.fn().mockResolvedValue([mockTemplate]),
        findFirst: vi.fn().mockResolvedValue(mockTemplate),
        create: vi.fn().mockResolvedValue(mockTemplate),
        update: vi.fn().mockResolvedValue(mockTemplate),
        delete: vi.fn().mockResolvedValue(mockTemplate),
      },
    } as any;
    service = new TemplatesService(prisma);
  });

  describe('getTemplatesByNiche', () => {
    it('should return templates for valid niche', async () => {
      const result = await service.getTemplatesByNiche('RETAIL');

      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { niche: 'RETAIL', isActive: true },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
      expect(result).toEqual([mockTemplate]);
    });

    it('should throw BadRequestException for invalid niche', async () => {
      await expect(service.getTemplatesByNiche('INVALID_NICHE')).rejects.toThrow(BadRequestException);
      expect(prisma.template.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when no templates match', async () => {
      prisma.template.findMany.mockResolvedValue([]);
      const result = await service.getTemplatesByNiche('BEAUTY');
      expect(result).toEqual([]);
    });
  });

  describe('getTemplatesByNicheAndType', () => {
    it('should return templates for valid niche and type', async () => {
      const result = await service.getTemplatesByNicheAndType('RETAIL', 'ONBOARDING');

      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { niche: 'RETAIL', type: 'ONBOARDING', isActive: true },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
      expect(result).toEqual([mockTemplate]);
    });

    it('should throw BadRequestException for invalid niche', async () => {
      await expect(service.getTemplatesByNicheAndType('INVALID', 'ONBOARDING')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid type', async () => {
      await expect(service.getTemplatesByNicheAndType('RETAIL', 'INVALID_TYPE')).rejects.toThrow(BadRequestException);
    });

    it('should return empty array when no templates match', async () => {
      prisma.template.findMany.mockResolvedValue([]);
      const result = await service.getTemplatesByNicheAndType('FITNESS', 'WORKFLOW');
      expect(result).toEqual([]);
    });
  });

  describe('createTemplate', () => {
    const dto = {
      niche: 'RETAIL',
      type: 'ONBOARDING',
      name: 'Novo Template',
      content: { blocks: [] },
    };

    it('should create template with provided data', async () => {
      const result = await service.createTemplate(orgId, dto);

      expect(prisma.template.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          niche: 'RETAIL',
          subniche: null,
          type: 'ONBOARDING',
          name: 'Novo Template',
          description: '',
          content: { blocks: [] },
          isActive: true,
          isDefault: false,
        },
      });
      expect(result.id).toBe('tmpl-1');
    });

    it('should use provided description and subniche', async () => {
      await service.createTemplate(orgId, {
        ...dto,
        description: 'Minha descrição',
        subniche: 'sub',
      });

      expect(prisma.template.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Minha descrição',
            subniche: 'sub',
          }),
        }),
      );
    });

    it('should set isActive to false when explicitly passed', async () => {
      await service.createTemplate(orgId, { ...dto, isActive: false });
      expect(prisma.template.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should set isDefault to true when passed', async () => {
      await service.createTemplate(orgId, { ...dto, isDefault: true });
      expect(prisma.template.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDefault: true }),
        }),
      );
    });
  });

  describe('updateTemplate', () => {
    it('should throw NotFoundException when template does not exist', async () => {
      prisma.template.findFirst.mockResolvedValue(null);
      await expect(service.updateTemplate(orgId, 'invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      await service.updateTemplate(orgId, 'tmpl-1', { name: 'Renamed' });

      expect(prisma.template.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: { name: 'Renamed' },
      });
    });

    it('should update all fields', async () => {
      const dto = {
        niche: 'ECOMMERCE',
        subniche: 'sub',
        type: 'WORKFLOW',
        name: 'Full Update',
        description: 'New desc',
        content: { key: 'val' },
        isActive: false,
        isDefault: true,
      };

      await service.updateTemplate(orgId, 'tmpl-1', dto);

      expect(prisma.template.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: dto,
      });
    });

    it('should set subniche to null when empty string provided', async () => {
      await service.updateTemplate(orgId, 'tmpl-1', { subniche: '' });
      expect(prisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subniche: null }),
        }),
      );
    });

    it('should return the updated template', async () => {
      const updated = { ...mockTemplate, name: 'Updated' };
      prisma.template.update.mockResolvedValue(updated);

      const result = await service.updateTemplate(orgId, 'tmpl-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteTemplate', () => {
    it('should throw NotFoundException when template does not exist', async () => {
      prisma.template.findFirst.mockResolvedValue(null);
      await expect(service.deleteTemplate(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should delete and return success message', async () => {
      prisma.template.findFirst.mockResolvedValue(mockTemplate);
      const result = await service.deleteTemplate(orgId, 'tmpl-1');
      expect(prisma.template.delete).toHaveBeenCalledWith({ where: { id: 'tmpl-1' } });
      expect(result).toEqual({ message: 'Template removido' });
    });
  });
});
