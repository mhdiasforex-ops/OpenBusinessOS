import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationController } from './organization.controller';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let orgService: any;

  beforeEach(() => {
    orgService = {
      findById: vi.fn().mockResolvedValue({ id: 'org-123', name: 'Test Org' }),
      update: vi.fn().mockResolvedValue({ id: 'org-123', name: 'Updated Org' }),
      getMembers: vi.fn().mockResolvedValue([{ id: 'user-1', role: 'admin' }]),
      addMember: vi.fn().mockResolvedValue({ id: 'user-2', role: 'member' }),
      removeMember: vi.fn().mockResolvedValue({ success: true }),
      getStats: vi.fn().mockResolvedValue({ totalMembers: 5 }),
    };
    controller = new OrganizationController(orgService);
  });

  it('should call findById with id', async () => {
    const result = await controller.findById('org-123', { id: 'user-1' });
    expect(orgService.findById).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ id: 'org-123', name: 'Test Org' });
  });

  it('should call update with id and dto', async () => {
    const dto = { name: 'Updated Org' };
    const result = await controller.update('org-123', dto);
    expect(orgService.update).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'org-123', name: 'Updated Org' });
  });

  it('should call getMembers with id', async () => {
    const result = await controller.getMembers('org-123');
    expect(orgService.getMembers).toHaveBeenCalledWith('org-123');
    expect(result).toEqual([{ id: 'user-1', role: 'admin' }]);
  });

  it('should call addMember with id and dto', async () => {
    const dto = { userId: 'user-2', role: 'member' };
    const result = await controller.addMember('org-123', dto);
    expect(orgService.addMember).toHaveBeenCalledWith('org-123', dto);
    expect(result).toEqual({ id: 'user-2', role: 'member' });
  });

  it('should call removeMember with id and userId', async () => {
    const result = await controller.removeMember('org-123', 'user-2');
    expect(orgService.removeMember).toHaveBeenCalledWith('org-123', 'user-2');
    expect(result).toEqual({ success: true });
  });

  it('should call getStats with id', async () => {
    const result = await controller.getStats('org-123');
    expect(orgService.getStats).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ totalMembers: 5 });
  });
});
