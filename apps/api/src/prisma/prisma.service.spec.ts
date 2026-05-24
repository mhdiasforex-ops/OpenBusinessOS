import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../common/prisma-tenant.middleware', () => ({
  setupPrismaTenantMiddleware: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = vi.fn().mockResolvedValue(undefined);
    $disconnect = vi.fn().mockResolvedValue(undefined);
    $on = vi.fn();
  }
  return { PrismaClient: MockPrismaClient };
});

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrismaService();
  });

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      vi.spyOn(service, '$connect').mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect', async () => {
      vi.spyOn(service, '$disconnect').mockResolvedValue(undefined);
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
    });
  });
});
