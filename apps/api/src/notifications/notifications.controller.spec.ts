import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    notificationsService = {
      list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
      markAsRead: vi.fn().mockResolvedValue({ id: 'notif-1', read: true }),
      remove: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new NotificationsController(notificationsService);
  });

  it('should call list with organizationId, userId, and filters', async () => {
    const filters = { type: 'alert' };
    const result = await controller.list(req, filters);
    expect(notificationsService.list).toHaveBeenCalledWith('org-123', 'user-1', filters);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should call markAllAsRead with organizationId and userId', async () => {
    const result = await controller.markAllAsRead(req);
    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith('org-123', 'user-1');
    expect(result).toEqual({ success: true });
  });

  it('should call markAsRead with id, organizationId, and userId', async () => {
    const result = await controller.markAsRead(req, 'notif-1');
    expect(notificationsService.markAsRead).toHaveBeenCalledWith('notif-1', 'org-123', 'user-1');
    expect(result).toEqual({ id: 'notif-1', read: true });
  });

  it('should call remove with id, organizationId, and userId', async () => {
    const result = await controller.remove(req, 'notif-1');
    expect(notificationsService.remove).toHaveBeenCalledWith('notif-1', 'org-123', 'user-1');
    expect(result).toEqual({ success: true });
  });
});
