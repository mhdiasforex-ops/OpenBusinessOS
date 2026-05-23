import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../common/tenant.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: any;
  let tenant: any;

  beforeEach(() => {
    prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
      role: { findFirst: vi.fn().mockResolvedValue({ id: 'role-1' }) },
    } as any;
    tenant = {} as any;
    service = new OrganizationService(prisma, tenant);
  });

  describe('findById', () => {
    it('should return organization with users', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Test', users: [] });
      const result = await service.findById('org-1');
      expect(result.id).toBe('org-1');
    });

    it('should throw NotFoundException for missing org', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return organization by slug', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', slug: 'test-org' });
      const result = await service.findBySlug('test-org');
      expect(result.slug).toBe('test-org');
    });

    it('should throw NotFoundException for missing slug', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update organization name', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.organization.update.mockResolvedValue({ id: 'org-1', name: 'New Name' });
      const result = await service.update('org-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException for missing org', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMembers', () => {
    it('should return active members', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u-1', name: 'Joao' }]);
      const result = await service.getMembers('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('addMember', () => {
    it('should throw ForbiddenException if member already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.addMember('org-1', { email: 'test@test.com', name: 'Test', password: 'test1234', roleName: 'member' }))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
