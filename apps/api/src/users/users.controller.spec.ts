import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      getUsers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getProfile: vi.fn().mockResolvedValue({ id: 'user-1', name: 'John' }),
      updateProfile: vi.fn().mockResolvedValue({ id: 'user-1', name: 'John Updated' }),
      updateUserRole: vi.fn().mockResolvedValue({ id: 'user-2', roleId: 'role-admin' }),
      deleteUser: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new UsersController(service);
  });

  it('should list users', async () => {
    const filters = { search: 'joao' } as any;
    const result = await controller.getUsers(req, filters);
    expect(result).toEqual({ items: [], total: 0 });
    expect(service.getUsers).toHaveBeenCalledWith('org-123', filters);
  });

  it('should get profile', async () => {
    const result = await controller.getProfile(req);
    expect(result).toEqual({ id: 'user-1', name: 'John' });
    expect(service.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('should update profile', async () => {
    const dto = { name: 'John Updated' } as any;
    const result = await controller.updateProfile(req, dto);
    expect(result).toEqual({ id: 'user-1', name: 'John Updated' });
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', dto);
  });

  it('should update user role', async () => {
    const dto = { roleId: 'role-admin' } as any;
    const result = await controller.updateUserRole(req, 'user-2', dto);
    expect(result).toEqual({ id: 'user-2', roleId: 'role-admin' });
    expect(service.updateUserRole).toHaveBeenCalledWith('org-123', 'user-2', dto, 'user-1');
  });

  it('should delete user', async () => {
    const result = await controller.deleteUser(req, 'user-2');
    expect(result).toEqual({ success: true });
    expect(service.deleteUser).toHaveBeenCalledWith('org-123', 'user-2', 'user-1');
  });
});
