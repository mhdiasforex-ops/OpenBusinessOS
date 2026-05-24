import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesController } from './roles.controller';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: any;

  beforeEach(() => {
    rolesService = {
      getRoles: vi.fn().mockResolvedValue([{ id: 'role-1', name: 'Admin' }]),
      createRole: vi.fn().mockResolvedValue({ id: 'role-2', name: 'Editor' }),
      updateRole: vi.fn().mockResolvedValue({ id: 'role-1', permissions: ['read'] }),
      deleteRole: vi.fn().mockResolvedValue({ success: true }),
      assignRole: vi.fn().mockResolvedValue({ success: true }),
      revokeRole: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new RolesController(rolesService);
  });

  it('should call getRoles with organizationId', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const result = await controller.getRoles(user);
    expect(rolesService.getRoles).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([{ id: 'role-1', name: 'Admin' }]);
  });

  it('should call createRole with organizationId, name, and permissions', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const body = { name: 'Editor', permissions: ['cms:manage'] };
    const result = await controller.createRole(user, body);
    expect(rolesService.createRole).toHaveBeenCalledWith('org-123', 'Editor', ['cms:manage']);
    expect(result).toEqual({ id: 'role-2', name: 'Editor' });
  });

  it('should call updateRole with id, organizationId, and permissions', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const body = { permissions: ['read'] };
    const result = await controller.updateRole(user, 'role-1', body);
    expect(rolesService.updateRole).toHaveBeenCalledWith('role-1', 'org-123', ['read']);
    expect(result).toEqual({ id: 'role-1', permissions: ['read'] });
  });

  it('should call deleteRole with id and organizationId', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const result = await controller.deleteRole(user, 'role-1');
    expect(rolesService.deleteRole).toHaveBeenCalledWith('role-1', 'org-123');
    expect(result).toEqual({ success: true });
  });

  it('should call assignRole with userId, roleId, and organizationId', async () => {
    const user = { organizationId: 'org-123', id: 'user-1' };
    const body = { userId: 'user-2', roleId: 'role-1' };
    const result = await controller.assignRole(user, body);
    expect(rolesService.assignRole).toHaveBeenCalledWith('user-2', 'role-1', 'org-123');
    expect(result).toEqual({ success: true });
  });

  it('should call revokeRole with userId and roleId', async () => {
    const body = { userId: 'user-2', roleId: 'role-1' };
    const result = await controller.revokeRole(body);
    expect(rolesService.revokeRole).toHaveBeenCalledWith('user-2', 'role-1');
    expect(result).toEqual({ success: true });
  });
});
