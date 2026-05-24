import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplateType } from './dto/email-template.dto';

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;
  let prisma: any;

  const orgId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      emailTemplate: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new EmailTemplatesService(prisma);
  });

  // ── findAll ────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should list all templates for an org ordered by createdAt desc', async () => {
      const templates = [{ id: 'tpl-1', name: 'Welcome', organizationId: orgId }];
      prisma.emailTemplate.findMany.mockResolvedValue(templates);

      const result = await service.findAll(orgId);

      expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(templates);
    });

    it('should filter by type when provided', async () => {
      prisma.emailTemplate.findMany.mockResolvedValue([]);

      await service.findAll(orgId, EmailTemplateType.WELCOME);

      expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, type: EmailTemplateType.WELCOME },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no templates exist', async () => {
      prisma.emailTemplate.findMany.mockResolvedValue([]);

      const result = await service.findAll(orgId);

      expect(result).toEqual([]);
    });

    it('should not include type filter when type is undefined', async () => {
      prisma.emailTemplate.findMany.mockResolvedValue([]);

      await service.findAll(orgId, undefined);

      expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ── findOne ────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a template when found', async () => {
      const template = { id: 'tpl-1', name: 'Welcome', organizationId: orgId };
      prisma.emailTemplate.findFirst.mockResolvedValue(template);

      const result = await service.findOne(orgId, 'tpl-1');

      expect(prisma.emailTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'tpl-1', organizationId: orgId },
      });
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);

      await expect(service.findOne(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when template belongs to another org', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);

      await expect(service.findOne(orgId, 'tpl-other-org')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ─────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      name: 'Welcome',
      subject: 'Welcome {{name}}!',
      body: '<h1>Hello {{name}}</h1>',
      type: EmailTemplateType.WELCOME,
    };

    it('should create a template with isActive defaulting to true', async () => {
      const expected = { id: 'tpl-1', organizationId: orgId, ...dto, isActive: true };
      prisma.emailTemplate.create.mockResolvedValue(expected);

      const result = await service.create(orgId, dto);

      expect(prisma.emailTemplate.create).toHaveBeenCalledWith({
        data: { ...dto, organizationId: orgId, isActive: true },
      });
      expect(result).toEqual(expected);
    });

    it('should pass isActive false when provided', async () => {
      prisma.emailTemplate.create.mockResolvedValue({ id: 'tpl-1' });

      await service.create(orgId, { ...dto, isActive: false });

      expect(prisma.emailTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }),
      );
    });

    it('should create with all optional fields', async () => {
      const fullDto = { ...dto, isActive: true };
      prisma.emailTemplate.create.mockResolvedValue({ id: 'tpl-1' });

      await service.create(orgId, fullDto);

      expect(prisma.emailTemplate.create).toHaveBeenCalledWith({
        data: { organizationId: orgId, ...fullDto },
      });
    });
  });

  // ── update ─────────────────────────────────────────────────────────

  describe('update', () => {
    it('should verify existence and partially update a template', async () => {
      const existing = { id: 'tpl-1', organizationId: orgId, name: 'Old Name' };
      const updated = { id: 'tpl-1', organizationId: orgId, name: 'New Name' };
      prisma.emailTemplate.findFirst.mockResolvedValue(existing);
      prisma.emailTemplate.update.mockResolvedValue(updated);

      const result = await service.update(orgId, 'tpl-1', { name: 'New Name' });

      expect(prisma.emailTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'tpl-1', organizationId: orgId },
      });
      expect(prisma.emailTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: { name: 'New Name' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);

      await expect(service.update(orgId, 'nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(prisma.emailTemplate.update).not.toHaveBeenCalled();
    });
  });

  // ── remove ─────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should verify existence and delete a template', async () => {
      const existing = { id: 'tpl-1', organizationId: orgId };
      prisma.emailTemplate.findFirst.mockResolvedValue(existing);
      prisma.emailTemplate.delete.mockResolvedValue(existing);

      const result = await service.remove(orgId, 'tpl-1');

      expect(prisma.emailTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'tpl-1', organizationId: orgId },
      });
      expect(prisma.emailTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
      expect(result).toEqual(existing);
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);

      await expect(service.remove(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.emailTemplate.delete).not.toHaveBeenCalled();
    });
  });

  // ── preview ────────────────────────────────────────────────────────

  describe('preview', () => {
    const template = {
      id: 'tpl-1',
      organizationId: orgId,
      subject: 'Hello {{name}}, your order #{{orderNumber}}',
      body: '<p>Hi {{name}}, order #{{orderNumber}} confirmed.</p>',
      type: EmailTemplateType.ORDER_CONFIRMATION,
    };

    it('should replace variables in subject and body', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(template);

      const result = await service.preview(orgId, 'tpl-1', { name: 'John', orderNumber: '12345' });

      expect(result).toEqual({
        subject: 'Hello John, your order #12345',
        body: '<p>Hi John, order #12345 confirmed.</p>',
        type: EmailTemplateType.ORDER_CONFIRMATION,
      });
    });

    it('should leave unreplaced variables as-is when variables are missing', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(template);

      const result = await service.preview(orgId, 'tpl-1', { name: 'John' });

      expect(result.subject).toBe('Hello John, your order #{{orderNumber}}');
      expect(result.body).toBe('<p>Hi John, order #{{orderNumber}} confirmed.</p>');
    });

    it('should work with empty variables object', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(template);

      const result = await service.preview(orgId, 'tpl-1', {});

      expect(result.subject).toBe(template.subject);
      expect(result.body).toBe(template.body);
    });

    it('should work with no variables argument (defaults to {})', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(template);

      const result = await service.preview(orgId, 'tpl-1');

      expect(result.subject).toBe(template.subject);
      expect(result.body).toBe(template.body);
    });

    it('should replace multiple occurrences of the same variable', async () => {
      const tpl = {
        ...template,
        subject: '{{name}} {{name}}',
        body: '{{name}} {{name}} {{name}}',
      };
      prisma.emailTemplate.findFirst.mockResolvedValue(tpl);

      const result = await service.preview(orgId, 'tpl-1', { name: 'John' });

      expect(result.subject).toBe('John John');
      expect(result.body).toBe('John John John');
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);

      await expect(service.preview(orgId, 'nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── seedDefaults ───────────────────────────────────────────────────

  describe('seedDefaults', () => {
    it('should create all default templates when none exist', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      const result = await service.seedDefaults(orgId);

      expect(result).toEqual({ seeded: 5 });
      expect(prisma.emailTemplate.findFirst).toHaveBeenCalledTimes(5);
      expect(prisma.emailTemplate.create).toHaveBeenCalledTimes(5);
    });

    it('should skip existing templates and only seed missing ones', async () => {
      // First template exists, rest don't
      prisma.emailTemplate.findFirst
        .mockResolvedValueOnce({ id: 'existing' }) // WELCOME exists
        .mockResolvedValueOnce(null) // INVOICE missing
        .mockResolvedValueOnce(null) // PAYMENT_REMINDER missing
        .mockResolvedValueOnce(null) // PASSWORD_RESET missing
        .mockResolvedValueOnce(null); // ORDER_CONFIRMATION missing
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      const result = await service.seedDefaults(orgId);

      expect(result).toEqual({ seeded: 4 });
      expect(prisma.emailTemplate.create).toHaveBeenCalledTimes(4);
    });

    it('should skip all when all templates already exist', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue({ id: 'existing' });
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      const result = await service.seedDefaults(orgId);

      expect(result).toEqual({ seeded: 0 });
      expect(prisma.emailTemplate.create).not.toHaveBeenCalled();
    });

    it('should create each template with correct type', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      await service.seedDefaults(orgId);

      const createCalls = prisma.emailTemplate.create.mock.calls;
      expect(createCalls[0][0].data.type).toBe(EmailTemplateType.WELCOME);
      expect(createCalls[1][0].data.type).toBe(EmailTemplateType.INVOICE);
      expect(createCalls[2][0].data.type).toBe(EmailTemplateType.PAYMENT_REMINDER);
      expect(createCalls[3][0].data.type).toBe(EmailTemplateType.PASSWORD_RESET);
      expect(createCalls[4][0].data.type).toBe(EmailTemplateType.ORDER_CONFIRMATION);
    });

    it('should create each template with isActive: true', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      await service.seedDefaults(orgId);

      for (const call of prisma.emailTemplate.create.mock.calls) {
        expect(call[0].data.isActive).toBe(true);
      }
    });

    it('should check existence by orgId and type combination', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      await service.seedDefaults(orgId);

      for (const call of prisma.emailTemplate.findFirst.mock.calls) {
        expect(call[0].where.organizationId).toBe(orgId);
        expect(call[0].where.type).toBeDefined();
      }
    });

    it('should set organizationId on created templates', async () => {
      prisma.emailTemplate.findFirst.mockResolvedValue(null);
      prisma.emailTemplate.create.mockResolvedValue({ id: 'new-tpl' });

      await service.seedDefaults(orgId);

      for (const call of prisma.emailTemplate.create.mock.calls) {
        expect(call[0].data.organizationId).toBe(orgId);
      }
    });
  });
});
