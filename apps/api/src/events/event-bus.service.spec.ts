import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBusService } from './event-bus.service';

describe('EventBusService', () => {
  let service: EventBusService;
  let eventEmitter: any;
  let prisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = { emit: vi.fn(), on: vi.fn(), off: vi.fn() };
    prisma = {
      event: {
        create: vi.fn().mockResolvedValue({ id: 'evt-1' }),
        update: vi.fn().mockResolvedValue({ id: 'evt-1', processedAt: new Date(), status: 'PROCESSED' }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    service = new EventBusService(eventEmitter as any, prisma as any, null);
  });

  describe('emit', () => {
    const event = { organizationId: 'org-1', type: 'TEST_EVENT', source: 'test', payload: { foo: 'bar' } };

    it('should persist event with PENDING status', async () => {
      await service.emit(event);
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          type: 'TEST_EVENT',
          source: 'test',
          payload: { foo: 'bar' },
          status: 'PENDING',
        },
      });
    });

    it('should emit locally via EventEmitter2', async () => {
      await service.emit(event);
      expect(eventEmitter.emit).toHaveBeenCalledWith('TEST_EVENT', event);
    });

    it('should mark event as PROCESSED after emitting', async () => {
      await service.emit(event);
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { processedAt: expect.any(Date), status: 'PROCESSED' },
      });
    });

    it('should not fail when update after emit fails', async () => {
      prisma.event.update.mockRejectedValue(new Error('Update failed'));
      await expect(service.emit(event)).resolves.toBeUndefined();
    });

    it('should publish to redisBus when available', async () => {
      const redisBus = { publish: vi.fn().mockResolvedValue(undefined) };
      service = new EventBusService(eventEmitter as any, prisma as any, redisBus as any);
      await service.emit(event);
      expect(redisBus.publish).toHaveBeenCalledWith('TEST_EVENT', { eventId: 'evt-1', ...event });
    });

    it('should handle redis publish failure gracefully', async () => {
      const redisBus = { publish: vi.fn().mockRejectedValue(new Error('Redis down')) };
      service = new EventBusService(eventEmitter as any, prisma as any, redisBus as any);
      await expect(service.emit(event)).resolves.toBeUndefined();
    });
  });

  describe('getEvents', () => {
    it('should return events for organization', async () => {
      prisma.event.findMany.mockResolvedValue([{ id: 'evt-1', type: 'TEST_EVENT' }]);
      const result = await service.getEvents('org-1');
      expect(result).toHaveLength(1);
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should filter by type when provided', async () => {
      await service.getEvents('org-1', 'SPECIFIC_EVENT');
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', type: 'SPECIFIC_EVENT' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect custom limit', async () => {
      await service.getEvents('org-1', undefined, 10);
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });
});
