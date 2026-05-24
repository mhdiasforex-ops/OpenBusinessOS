import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';

vi.mock('ioredis');
import Redis from 'ioredis';

import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let configService: any;
  let mockRedisClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient = {
      on: vi.fn().mockReturnThis(),
      connect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
    };
    (Redis as unknown as vi.Mock).mockImplementation(() => mockRedisClient);
    configService = { get: vi.fn().mockReturnValue('redis://localhost:6379') };
    service = new RedisService(configService);
  });

  describe('onModuleInit', () => {
    it('should create Redis client and call connect', async () => {
      await service.onModuleInit();
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', expect.objectContaining({
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      }));
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection error gracefully', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection refused'));
      await service.onModuleInit();
      expect(service.isConnected()).toBe(false);
      expect(service.getClient()).toBeNull();
    });
  });

  describe('getClient', () => {
    it('should return null when not connected', () => {
      expect(service.getClient()).toBeNull();
    });

    it('should return client when connected', async () => {
      await service.onModuleInit();
      mockRedisClient.on.mock.calls.find((c: any[]) => c[0] === 'connect')[1]();
      const client = service.getClient();
      expect(client).toBe(mockRedisClient);
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true after connect event', () => {
      service['_connected'] = true;
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('createDedicatedClient', () => {
    it('should return null when _client is null', () => {
      expect(service.createDedicatedClient()).toBeNull();
    });

    it('should create new Redis client when _client exists', async () => {
      await service.onModuleInit();
      (Redis as unknown as vi.Mock).mockClear();
      const dedicatedMock = { on: vi.fn() };
      (Redis as unknown as vi.Mock).mockReturnValue(dedicatedMock);

      const result = service.createDedicatedClient();
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', expect.objectContaining({
        maxRetriesPerRequest: null,
        lazyConnect: false,
      }));
      expect(result).toBe(dedicatedMock);
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit client when connected', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();
      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should do nothing when client is null', async () => {
      await service.onModuleDestroy();
      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });

    it('should disconnect on quit error', async () => {
      await service.onModuleInit();
      mockRedisClient.quit.mockRejectedValue(new Error('quit failed'));
      await service.onModuleDestroy();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});
