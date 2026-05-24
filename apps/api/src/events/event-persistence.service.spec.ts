import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventPersistenceService } from './event-persistence.service';

describe('EventPersistenceService', () => {
  let service: EventPersistenceService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      event: {
        update: vi.fn().mockResolvedValue({ id: 'evt-1', status: 'FAILED' }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    service = new EventPersistenceService(prisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('markFailed', () => {
    it('should update event status to FAILED', async () => {
      await service.markFailed('evt-1', 'Something went wrong');

      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { status: 'FAILED' },
      });
    });

    it('should throw if event does not exist', async () => {
      prisma.event.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.markFailed('invalid-id', 'Not found')).rejects.toThrow(
        'Record not found',
      );
    });
  });

  describe('retryPending', () => {
    it('should find FAILED events for the given org', async () => {
      const failedEvents = [
        { id: 'evt-1', organizationId: 'org-1', status: 'FAILED' },
        { id: 'evt-2', organizationId: 'org-1', status: 'FAILED' },
      ];
      prisma.event.findMany.mockResolvedValue(failedEvents);

      const result = await service.retryPending('org-1');

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', status: 'FAILED' },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(failedEvents);
    });

    it('should return empty array when no failed events exist', async () => {
      prisma.event.findMany.mockResolvedValue([]);

      const result = await service.retryPending('org-1');

      expect(result).toEqual([]);
    });

    it('should only return events for the specified org', async () => {
      const org1Events = [{ id: 'evt-1', organizationId: 'org-1', status: 'FAILED' }];
      const org2Events = [{ id: 'evt-2', organizationId: 'org-2', status: 'FAILED' }];
      prisma.event.findMany.mockImplementation(
        ({ where }: any) =>
          where.organizationId === 'org-1' ? org1Events : org2Events,
      );

      const result = await service.retryPending('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].organizationId).toBe('org-1');
    });

    it('should limit results to 100', async () => {
      await service.retryPending('org-1');

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should order results by createdAt ascending', async () => {
      await service.retryPending('org-1');

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });
  });
});
