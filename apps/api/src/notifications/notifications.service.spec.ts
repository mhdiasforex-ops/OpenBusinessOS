import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const orgId = 'org-123';
  const userId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      notification: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new NotificationsService(prisma);
  });

  // ── list ──────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated notifications with default page/perPage', async () => {
      const notifications = [{ id: 'notif-1', organizationId: orgId, userId }];
      prisma.notification.findMany.mockResolvedValue(notifications);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.list(orgId, userId, {});

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 25,
      });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { organizationId: orgId, userId },
      });
      expect(result).toEqual({
        data: notifications,
        total: 1,
        page: 1,
        perPage: 25,
        totalPages: 1,
      });
    });

    it('should apply read filter when provided', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { read: false });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ read: false }) }),
      );
    });

    it('should apply type filter when provided', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { type: 'INFO' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'INFO' }) }),
      );
    });

    it('should apply custom page and perPage', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { page: 3, perPage: 10 });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(57);

      const result = await service.list(orgId, userId, { perPage: 10 });

      expect(result.totalPages).toBe(6);
    });

    it('should return empty data when no notifications exist', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.list(orgId, userId, {});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should not include read filter when read is undefined', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { read: undefined });

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.read).toBeUndefined();
    });

    it('should not include type filter when type is undefined', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { type: undefined });

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.type).toBeUndefined();
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark an existing notification as read', async () => {
      const notification = { id: 'notif-1', organizationId: orgId, userId, read: false };
      const updated = { ...notification, read: true };

      prisma.notification.findFirst.mockResolvedValue(notification);
      prisma.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead('notif-1', orgId, userId);

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', organizationId: orgId, userId },
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent', orgId, userId)).rejects.toThrow(NotFoundException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification belongs to another user', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', orgId, 'other-user')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when notification belongs to another org', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', 'other-org', userId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── markAllAsRead ─────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for the user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(orgId, userId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, userId, read: false },
        data: { read: true },
      });
      expect(result).toEqual({ message: '5 notificações marcadas como lidas', count: 5 });
    });

    it('should return count 0 when no unread notifications exist', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead(orgId, userId);

      expect(result).toEqual({ message: '0 notificações marcadas como lidas', count: 0 });
    });
  });

  // ── remove ────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete an existing notification', async () => {
      const notification = { id: 'notif-1', organizationId: orgId, userId };
      prisma.notification.findFirst.mockResolvedValue(notification);
      prisma.notification.delete.mockResolvedValue(notification);

      const result = await service.remove('notif-1', orgId, userId);

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', organizationId: orgId, userId },
      });
      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(result).toEqual({ message: 'Notificação removida' });
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', orgId, userId)).rejects.toThrow(NotFoundException);
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification belongs to another user', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.remove('notif-1', orgId, 'other-user')).rejects.toThrow(NotFoundException);
    });
  });
});
