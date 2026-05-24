import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationController } from './notification.controller';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      list: vi.fn().mockResolvedValue([]),
      markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
      markAsRead: vi.fn().mockResolvedValue({ id: 'notif-1', read: true }),
      remove: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new NotificationController(service);
  });

  it('should call list with organizationId, userId, and filters', async () => {
    const filters = { type: 'alert' };
    const result = await controller.list(req, filters);
    expect(service.list).toHaveBeenCalledWith('org-123', 'user-1', filters);
    expect(result).toEqual([]);
  });

  it('should call markAllAsRead with organizationId and userId', async () => {
    const result = await controller.markAllAsRead(req);
    expect(service.markAllAsRead).toHaveBeenCalledWith('org-123', 'user-1');
    expect(result).toEqual({ success: true });
  });

  it('should call markAsRead with id and organizationId', async () => {
    const result = await controller.markAsRead('notif-1', req);
    expect(service.markAsRead).toHaveBeenCalledWith('notif-1', 'org-123');
    expect(result).toEqual({ id: 'notif-1', read: true });
  });

  it('should call remove with id and organizationId', async () => {
    const result = await controller.remove('notif-1', req);
    expect(service.remove).toHaveBeenCalledWith('notif-1', 'org-123');
    expect(result).toEqual({ success: true });
  });
});
