import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesService, DEFAULT_ROLES } from './roles.service';
import { NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;
  let tenant: any;

  beforeEach(() => {
    prisma = {
      role: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      permission: {
        deleteMany: vi.fn(),
      },
      userRole: {
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };
    tenant = { getOrgId: vi.fn() };
    service = new RolesService(prisma, tenant);
  });

  describe('seedDefaultRoles', () => {
    it('should create all default roles when none exist', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.create.mockImplementation(async (args: any) => args.data);

      await service.seedDefaultRoles('org-1');

      const roleNames = Object.values(DEFAULT_ROLES).map((r) => r.name);
      expect(prisma.role.create).toHaveBeenCalledTimes(roleNames.length);
      for (const name of roleNames) {
        expect(prisma.role.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ name, organizationId: 'org-1' }),
          }),
        );
      }
    });

    it('should skip existing roles and create only new ones', async () => {
      prisma.role.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-admin' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await service.seedDefaultRoles('org-1');

      expect(prisma.role.create).toHaveBeenCalledTimes(3);
      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'owner' }),
        }),
      );
      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'manager' }),
        }),
      );
      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'viewer' }),
        }),
      );
      const adminCalls = prisma.role.create.mock.calls.filter(
        (call: any[]) => call[0].data.name === 'admin',
      );
      expect(adminCalls).toHaveLength(0);
    });

    it('should query each role by name and organizationId', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 'new-role' });

      await service.seedDefaultRoles('org-1');

      expect(prisma.role.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-1' }),
        }),
      );
    });

    it('should create permissions with resource and action for each role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.role.create.mockImplementation(async (args: any) => args.data);

      await service.seedDefaultRoles('org-1');

      for (const call of prisma.role.create.mock.calls) {
        const createdPermissions = call[0].data.permissions.create;
        expect(createdPermissions.length).toBeGreaterThan(0);
        for (const perm of createdPermissions) {
          expect(perm).toHaveProperty('resource');
          expect(perm).toHaveProperty('action');
        }
      }
    });
  });

  describe('getRoles', () => {
    it('should return roles with permissions and user count for the given org', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          permissions: [{ resource: 'users', action: 'read' }],
          _count: { users: 5 },
        },
      ];
      prisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getRoles('org-1');

      expect(result).toEqual(mockRoles);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: { permissions: true, _count: { select: { users: true } } },
      });
    });

    it('should return an empty array when no roles exist for the org', async () => {
      prisma.role.findMany.mockResolvedValue([]);

      const result = await service.getRoles('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('createRole', () => {
    it('should create a role with parsed permissions', async () => {
      const permissions = ['users:read', 'users:manage'];
      const expectedData = {
        name: 'custom-role',
        organizationId: 'org-1',
        permissions: {
          create: [
            { resource: 'users', action: 'read' },
            { resource: 'users', action: 'manage' },
          ],
        },
      };
      prisma.role.create.mockResolvedValue({
        id: 'new-role',
        name: 'custom-role',
        permissions: [
          { resource: 'users', action: 'read' },
          { resource: 'users', action: 'manage' },
        ],
      });

      const result = await service.createRole('org-1', 'custom-role', permissions);

      expect(prisma.role.create).toHaveBeenCalledWith({
        data: expectedData,
        include: { permissions: true },
      });
      expect(result.permissions).toHaveLength(2);
    });

    it('should handle single permission string', async () => {
      prisma.role.create.mockResolvedValue({
        id: 'new-role',
        name: 'minimal-role',
        permissions: [{ resource: 'analytics', action: 'read' }],
      });

      const result = await service.createRole('org-1', 'minimal-role', ['analytics:read']);

      expect(prisma.role.create).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0]).toEqual({ resource: 'analytics', action: 'read' });
    });
  });

  describe('updateRole', () => {
    it('should replace all permissions on the role', async () => {
      const existingRole = { id: 'role-1', name: 'manager' };
      prisma.role.findFirst.mockResolvedValue(existingRole);
      prisma.permission.deleteMany.mockResolvedValue({ count: 5 });
      prisma.role.update.mockResolvedValue({
        id: 'role-1',
        name: 'manager',
        permissions: [{ resource: 'users', action: 'read' }],
      });

      const result = await service.updateRole('role-1', 'org-1', ['users:read']);

      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: { id: 'role-1', organizationId: 'org-1' },
      });
      expect(prisma.permission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1' },
      });
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: {
          permissions: {
            create: [{ resource: 'users', action: 'read' }],
          },
        },
        include: { permissions: true },
      });
      expect(result.permissions).toHaveLength(1);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole('nonexistent', 'org-1', ['users:read']),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.permission.deleteMany).not.toHaveBeenCalled();
      expect(prisma.role.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when role belongs to a different org', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole('role-1', 'different-org', ['users:read']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRole', () => {
    it('should delete a non-owner role', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'role-1', name: 'manager' });
      prisma.role.delete.mockResolvedValue({ id: 'role-1' });

      const result = await service.deleteRole('role-1', 'org-1');

      expect(result).toEqual({ message: 'Role removida' });
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
    });

    it('should throw NotFoundException when role is not found', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(service.deleteRole('nonexistent', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.role.delete).not.toHaveBeenCalled();
    });

    it('should throw an error when trying to delete the owner role', async () => {
      prisma.role.findFirst.mockResolvedValue({ id: 'role-owner', name: 'owner' });

      await expect(service.deleteRole('role-owner', 'org-1')).rejects.toThrow(
        'Cannot delete owner role',
      );
      expect(prisma.role.delete).not.toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    it('should create a new user-role assignment when none exists', async () => {
      prisma.userRole.findFirst.mockResolvedValue(null);
      prisma.userRole.create.mockResolvedValue({
        id: 'assignment-1',
        userId: 'user-1',
        roleId: 'role-1',
      });

      const result = await service.assignRole('user-1', 'role-1', 'org-1');

      expect(result).toEqual({
        id: 'assignment-1',
        userId: 'user-1',
        roleId: 'role-1',
      });
      expect(prisma.userRole.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', roleId: 'role-1' },
      });
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', roleId: 'role-1' },
      });
    });

    it('should return existing assignment without creating a duplicate', async () => {
      const existing = {
        id: 'assignment-1',
        userId: 'user-1',
        roleId: 'role-1',
      };
      prisma.userRole.findFirst.mockResolvedValue(existing);

      const result = await service.assignRole('user-1', 'role-1', 'org-1');

      expect(result).toBe(existing);
      expect(prisma.userRole.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeRole', () => {
    it('should delete the user-role assignment using compound key', async () => {
      const deleted = {
        id: 'assignment-1',
        userId: 'user-1',
        roleId: 'role-1',
      };
      prisma.userRole.delete.mockResolvedValue(deleted);

      const result = await service.revokeRole('user-1', 'role-1');

      expect(result).toBe(deleted);
      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-1' } },
      });
    });

    it('should propagate Prisma errors when assignment does not exist', async () => {
      const prismaError = new Error('Record to delete does not exist');
      prisma.userRole.delete.mockRejectedValue(prismaError);

      await expect(service.revokeRole('nonexistent-user', 'nonexistent-role')).rejects.toThrow(
        'Record to delete does not exist',
      );
    });
  });
});
