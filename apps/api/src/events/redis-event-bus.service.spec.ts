import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisEventBusService } from './redis-event-bus.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('RedisEventBusService', () => {
  let service: RedisEventBusService;
  let eventEmitter: EventEmitter2;
  let redisService: any;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    redisService = {
      isConnected: vi.fn().mockReturnValue(false),
      getClient: vi.fn().mockReturnValue(null),
      createDedicatedClient: vi.fn().mockResolvedValue({
        subscribe: vi.fn(),
        on: vi.fn(),
        quit: vi.fn(),
      }),
    } as any;
    service = new RedisEventBusService(eventEmitter, redisService);
  });

  describe('Local-only mode (no Redis)', () => {
    it('should emit events locally via EventEmitter2 when Redis is unavailable', async () => {
      const listener = vi.fn();
      eventEmitter.on('TRANSACTION_CREATED', listener);

      await service.publish('TRANSACTION_CREATED', {
        organizationId: 'org-123',
        type: 'TRANSACTION_CREATED',
        payload: { id: 'tx-1' },
      });

      expect(listener).toHaveBeenCalledWith({
        organizationId: 'org-123',
        type: 'TRANSACTION_CREATED',
        payload: { id: 'tx-1' },
      });
    });
  });

  describe('With Redis', () => {
    let publishMock: any;

    beforeEach(() => {
      publishMock = vi.fn().mockResolvedValue(1);
      redisService.isConnected.mockReturnValue(true);
      redisService.getClient.mockReturnValue({ publish: publishMock });
      service = new RedisEventBusService(eventEmitter, redisService);
    });

    it('should publish events to Redis when connected', async () => {
      await service.publish('TRANSACTION_CREATED', {
        organizationId: 'org-123',
        payload: { id: 'tx-1' },
      });

      expect(publishMock).toHaveBeenCalled();
      const [channel, payload] = publishMock.mock.calls[0];
      expect(channel).toContain('TRANSACTION_CREATED');
      expect(JSON.parse(payload)).toEqual({
        organizationId: 'org-123',
        payload: { id: 'tx-1' },
      });
    });

    it('should fallback to local emit if Redis publish throws', async () => {
      publishMock.mockRejectedValue(new Error('Redis connection lost'));
      const listener = vi.fn();
      eventEmitter.on('TRANSACTION_CREATED', listener);

      await service.publish('TRANSACTION_CREATED', {
        organizationId: 'org-123',
        payload: { id: 'tx-1' },
      });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should handle destroy gracefully when no subscriber exists', async () => {
      // No Redis connected — subscriberClient is null
      redisService.isConnected.mockReturnValue(false);
      const svc = new RedisEventBusService(eventEmitter, redisService);

      // Should not throw
      await svc.onModuleDestroy();
    });
  });
});
