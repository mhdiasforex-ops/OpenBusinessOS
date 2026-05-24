import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new NotificationService(prisma);
  });

  const orgId = 'org-123';
  const userId = 'user-456';

  // ────────────────────────────────────────────────
  //  List
  // ────────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated notifications', async () => {
      const notifications = [
        { id: 'notif-1', type: 'info', read: false, message: 'Hello' },
        { id: 'notif-2', type: 'warning', read: true, message: 'Alert' },
      ];
      prisma.notification.findMany.mockResolvedValue(notifications);
      prisma.notification.count.mockResolvedValue(15);

      const result = await service.list(orgId, userId, { page: 2, perPage: 10 });

      expect(result).toEqual({ data: notifications, total: 15, page: 2, perPage: 10 });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, userId },
          orderBy: { createdAt: 'desc' },
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should default page and perPage', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, {});

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 25 }),
      );
    });

    it('should filter by type', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { type: 'info' });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'info' }) }),
      );
    });

    it('should filter by read status', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { read: false });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ read: false }) }),
      );
    });

    it('should apply both type and read filters simultaneously', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.list(orgId, userId, { type: 'warning', read: true });

      const where = prisma.notification.findMany.mock.calls[0][0].where;
      expect(where.type).toBe('warning');
      expect(where.read).toBe(true);
    });
  });

  // ────────────────────────────────────────────────
  //  Mark As Read
  // ────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'notif-1', organizationId: orgId, read: false });
      prisma.notification.update.mockResolvedValue({ id: 'notif-1', read: true });

      const result = await service.markAsRead('notif-1', orgId);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
      });
      expect(result).toEqual({ id: 'notif-1', read: true });
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-999', orgId)).rejects.toThrow(NotFoundException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('should verify organization ownership', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', 'different-org')).rejects.toThrow(NotFoundException);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────
  //  Mark All As Read
  // ────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read and return count', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(orgId, userId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, userId, read: false },
        data: { read: true },
      });
      expect(result).toEqual({ updated: 5 });
    });

    it('should return 0 when no unread notifications exist', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead(orgId, userId);

      expect(result).toEqual({ updated: 0 });
    });

    it('should scope by both orgId and userId', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      await service.markAllAsRead(orgId, userId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, userId, read: false },
        }),
      );
    });
  });

  // ────────────────────────────────────────────────
  //  Remove
  // ────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete an existing notification', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'notif-1', organizationId: orgId });
      prisma.notification.delete.mockResolvedValue({ id: 'notif-1' });

      const result = await service.remove('notif-1', orgId);

      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.remove('notif-999', orgId)).rejects.toThrow(NotFoundException);
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });

    it('should verify organization ownership before deleting', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.remove('notif-1', 'different-org')).rejects.toThrow(NotFoundException);
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
  });
});
