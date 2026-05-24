import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
}));

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: any;
  let tenant: any;

  beforeEach(() => {
    prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      role: { findFirst: vi.fn().mockResolvedValue(null) },
      product: { count: vi.fn().mockResolvedValue(0) },
      customer: { count: vi.fn().mockResolvedValue(0) },
      transaction: { count: vi.fn().mockResolvedValue(0) },
      workflow: { count: vi.fn().mockResolvedValue(0) },
    } as any;
    tenant = {} as any;
    service = new OrganizationService(prisma, tenant);
  });

  describe('findById', () => {
    it('should return organization with users', async () => {
      const mockOrg = { id: 'org-1', name: 'Test Org', users: [{ id: 'u-1', name: 'Joao', email: 'joao@test.com', isActive: true, lastLoginAt: null }] };
      prisma.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.findById('org-1');

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        include: {
          users: {
            select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true },
          },
        },
      });
      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException when org does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
      await expect(service.findById('invalid')).rejects.toThrow('Organização não encontrada');
    });
  });

  describe('findBySlug', () => {
    it('should return organization by slug', async () => {
      const mockOrg = { id: 'org-1', slug: 'test-org', name: 'Test Org' };
      prisma.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.findBySlug('test-org');

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({ where: { slug: 'test-org' } });
      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException when slug not found', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
      await expect(service.findBySlug('missing')).rejects.toThrow('Organização não encontrada');
    });
  });

  describe('update', () => {
    it('should update organization name', async () => {
      const mockUpdated = { id: 'org-1', name: 'New Name', niche: null, settings: null };
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.organization.update.mockResolvedValue(mockUpdated);

      const result = await service.update('org-1', { name: 'New Name' });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { name: 'New Name', niche: undefined, settings: undefined },
      });
      expect(result.name).toBe('New Name');
    });

    it('should update organization niche', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.organization.update.mockResolvedValue({ id: 'org-1', niche: 'SERVICES' });

      await service.update('org-1', { niche: 'SERVICES' });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { name: undefined, niche: 'SERVICES', settings: undefined },
      });
    });

    it('should update organization settings', async () => {
      const settings = { currency: 'BRL', timezone: 'America/Sao_Paulo' };
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.organization.update.mockResolvedValue({ id: 'org-1', settings });

      await service.update('org-1', { settings });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { name: undefined, niche: undefined, settings },
      });
    });

    it('should throw NotFoundException for missing org', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMembers', () => {
    it('should return active members with roles', async () => {
      const mockMembers = [
        { id: 'u-1', name: 'Joao', email: 'joao@test.com', isActive: true, lastLoginAt: null, roles: [{ role: { name: 'admin' } }] },
      ];
      prisma.user.findMany.mockResolvedValue(mockMembers);

      const result = await service.getMembers('org-1');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          lastLoginAt: true,
          roles: { include: { role: { select: { name: true } } } },
        },
      });
      expect(result).toEqual(mockMembers);
    });

    it('should return empty array when no members', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      const result = await service.getMembers('org-1');
      expect(result).toEqual([]);
    });
  });

  describe('addMember', () => {
    const addMemberDto = { email: 'ana@empresa.com', name: 'Ana Costa', password: 'temp1234', roleName: 'admin' };

    it('should create user with role and return it', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue({ id: 'role-1' });

      const createdUser = {
        id: 'user-1',
        organizationId: 'org-1',
        name: 'Ana Costa',
        email: 'ana@empresa.com',
        roles: [{ role: { id: 'role-1', name: 'admin' } }],
      };
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await service.addMember('org-1', addMemberDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'ana@empresa.com', organizationId: 'org-1' },
      });
      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: { name: 'admin', organizationId: 'org-1' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          name: 'Ana Costa',
          email: 'ana@empresa.com',
          passwordHash: '$2a$12$hashedpassword',
          roles: { create: { roleId: 'role-1' } },
        },
        include: { roles: { include: { role: true } } },
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw ForbiddenException when email already exists in org', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.addMember('org-1', addMemberDto)).rejects.toThrow(ForbiddenException);
      await expect(service.addMember('org-1', addMemberDto)).rejects.toThrow('Membro já existe nesta organização');
      expect(prisma.role.findFirst).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when role does not exist in org', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(service.addMember('org-1', addMemberDto)).rejects.toThrow(NotFoundException);
      await expect(service.addMember('org-1', addMemberDto)).rejects.toThrow('Role não encontrada');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('should soft-delete user and return success message', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
      prisma.user.update.mockResolvedValue({ id: 'user-1', isActive: false });

      const result = await service.removeMember('org-1', 'user-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', organizationId: 'org-1' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isActive: false },
      });
      expect(result).toEqual({ message: 'Membro removido' });
    });

    it('should throw NotFoundException when user not found in org', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.removeMember('org-1', 'invalid')).rejects.toThrow(NotFoundException);
      await expect(service.removeMember('org-1', 'invalid')).rejects.toThrow('Membro não encontrado');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return counts for all entities', async () => {
      prisma.user.count.mockResolvedValue(5);
      prisma.product.count.mockResolvedValue(10);
      prisma.customer.count.mockResolvedValue(20);
      prisma.transaction.count.mockResolvedValue(100);
      prisma.workflow.count.mockResolvedValue(3);

      const result = await service.getStats('org-1');

      expect(prisma.user.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1', isActive: true } });
      expect(prisma.product.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1', isActive: true } });
      expect(prisma.customer.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1' } });
      expect(prisma.transaction.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1' } });
      expect(prisma.workflow.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1', isActive: true } });
      expect(result).toEqual({ users: 5, products: 10, customers: 20, transactions: 100, workflows: 3 });
    });

    it('should return zeros when no data exists', async () => {
      const result = await service.getStats('org-1');
      expect(result).toEqual({ users: 0, products: 0, customers: 0, transactions: 0, workflows: 0 });
    });
  });
});
