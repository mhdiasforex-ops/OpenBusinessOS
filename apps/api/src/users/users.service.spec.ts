import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    email: 'joao@test.com',
    name: 'Joao Silva',
    phone: '11999999999',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn(),
      },
      userRole: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({}),
      },
      role: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as any;
    service = new UsersService(prisma);
  });

  describe('getUsers', () => {
    const defaultFilters = { page: 1, perPage: 25 };

    it('should return paginated users list', async () => {
      const users = [
        { ...mockUser, roles: [{ role: { id: 'role-1', name: 'admin' } }] },
        { ...mockUser, id: 'user-2', email: 'maria@test.com', roles: [{ role: { id: 'role-2', name: 'member' } }] },
      ];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.getUsers('org-1', defaultFilters);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 25,
        select: expect.any(Object),
      });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1', isActive: true } });
      expect(result).toEqual({
        data: users,
        total: 2,
        page: 1,
        perPage: 25,
        totalPages: 1,
      });
    });

    it('should apply pagination correctly', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(50);

      const result = await service.getUsers('org-1', { page: 3, perPage: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.totalPages).toBe(5);
    });

    it('should filter by roleId', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getUsers('org-1', { ...defaultFilters, roleId: 'role-1' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roles: { some: { roleId: 'role-1' } },
          }),
        }),
      );
    });

    it('should filter by search query on name and email', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getUsers('org-1', { ...defaultFilters, search: 'joao' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'joao', mode: 'insensitive' } },
              { email: { contains: 'joao', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should combine roleId and search filters', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getUsers('org-1', { ...defaultFilters, roleId: 'role-1', search: 'maria' });

      const where = prisma.user.findMany.mock.calls[0][0].where;
      expect(where.roles).toEqual({ some: { roleId: 'role-1' } });
      expect(where.OR).toBeDefined();
    });

    it('should use defaults when page and perPage are not provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getUsers('org-1', {});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 25 }),
      );
    });
  });

  describe('getProfile', () => {
    const profileUser = {
      ...mockUser,
      organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
      roles: [
        {
          role: {
            id: 'role-1',
            name: 'admin',
            permissions: [
              { resource: 'users', action: 'read' },
              { resource: 'products', action: 'write' },
            ],
          },
        },
      ],
    };

    it('should return user profile with flattened roles and permissions', async () => {
      prisma.user.findUnique.mockResolvedValue(profileUser);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.name).toBe('Joao Silva');
      expect(result.roles).toEqual(['admin']);
      expect(result.permissions).toEqual(['users:read', 'products:write']);
      expect(result.organization).toEqual({ id: 'org-1', name: 'Test Org', slug: 'test-org' });
    });

    it('should flatten multiple roles and permissions', async () => {
      const multiRoleUser = {
        ...profileUser,
        roles: [
          {
            role: {
              id: 'role-1',
              name: 'admin',
              permissions: [{ resource: 'users', action: 'read' }],
            },
          },
          {
            role: {
              id: 'role-2',
              name: 'manager',
              permissions: [{ resource: 'reports', action: 'read' }],
            },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(multiRoleUser);

      const result = await service.getProfile('user-1');

      expect(result.roles).toEqual(['admin', 'manager']);
      expect(result.permissions).toEqual(['users:read', 'reports:read']);
    });

    it('should return empty arrays when user has no roles', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...profileUser, roles: [] });

      const result = await service.getProfile('user-1');

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('invalid')).rejects.toThrow(NotFoundException);
      await expect(service.getProfile('invalid')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('updateProfile', () => {
    it('should update user name and phone', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, name: 'Joao Updated', phone: '11888888888' };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', { name: 'Joao Updated', phone: '11888888888' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Joao Updated', phone: '11888888888' },
        select: expect.any(Object),
      });
      expect(result.name).toBe('Joao Updated');
      expect(result.phone).toBe('11888888888');
    });

    it('should update only name when phone is not provided', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, name: 'New Name' });

      await service.updateProfile('user-1', { name: 'New Name' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name', phone: undefined },
        select: expect.any(Object),
      });
    });

    it('should update only phone when name is not provided', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, phone: '11900000000' });

      await service.updateProfile('user-1', { phone: '11900000000' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: undefined, phone: '11900000000' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUserRole', () => {
    const dto = { roleId: 'role-2' };

    it('should change user role and return updated user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-2', organizationId: 'org-1', roles: [{ id: 'ur-1', roleId: 'role-1' }] });
      prisma.role.findFirst.mockResolvedValue({ id: 'role-2', name: 'manager' });
      const updatedUser = {
        id: 'user-2',
        email: 'maria@test.com',
        name: 'Maria',
        phone: null,
        isActive: true,
        roles: [{ role: { id: 'role-2', name: 'manager' } }],
      };
      prisma.user.findUnique.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('org-1', 'user-2', dto, 'admin-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-2', organizationId: 'org-1' },
        include: { roles: true },
      });
      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: { id: 'role-2', organizationId: 'org-1' },
      });
      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-2' } });
      expect(prisma.userRole.create).toHaveBeenCalledWith({ data: { userId: 'user-2', roleId: 'role-2' } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when target user does not exist in org', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.updateUserRole('org-1', 'invalid', dto, 'admin-1')).rejects.toThrow(NotFoundException);
      expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when role does not belong to org', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-2', organizationId: 'org-1', roles: [] });
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(service.updateUserRole('org-1', 'user-2', dto, 'admin-1')).rejects.toThrow(NotFoundException);
      await expect(service.updateUserRole('org-1', 'user-2', dto, 'admin-1')).rejects.toThrow('Cargo não encontrado nesta organização');
      expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when admin tries to change own role', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'admin-1', organizationId: 'org-1', roles: [] });
      prisma.role.findFirst.mockResolvedValue({ id: 'role-2' });

      await expect(service.updateUserRole('org-1', 'admin-1', dto, 'admin-1')).rejects.toThrow(ForbiddenException);
      await expect(service.updateUserRole('org-1', 'admin-1', dto, 'admin-1')).rejects.toThrow('Você não pode alterar seu próprio cargo');
      expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should soft-delete user and return success message', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-2', organizationId: 'org-1' });
      prisma.user.update.mockResolvedValue({ id: 'user-2', isActive: false });

      const result = await service.deleteUser('org-1', 'user-2', 'admin-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-2', organizationId: 'org-1' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isActive: false },
      });
      expect(result).toEqual({ message: 'Usuário removido com sucesso' });
    });

    it('should throw NotFoundException when target user does not exist in org', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.deleteUser('org-1', 'invalid', 'admin-1')).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when admin tries to delete own user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'admin-1', organizationId: 'org-1' });

      await expect(service.deleteUser('org-1', 'admin-1', 'admin-1')).rejects.toThrow(ForbiddenException);
      await expect(service.deleteUser('org-1', 'admin-1', 'admin-1')).rejects.toThrow('Você não pode remover seu próprio usuário');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
