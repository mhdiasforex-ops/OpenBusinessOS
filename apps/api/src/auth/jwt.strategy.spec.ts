import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let config: { get: ReturnType<typeof vi.fn> };
  let authService: { validateUser: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    config = { get: vi.fn().mockReturnValue('test-secret') };
    authService = { validateUser: vi.fn() };
    strategy = new JwtStrategy(config as any, authService as any);
  });

  describe('validate', () => {
    it('should return user with id, email, organizationId, roles and permissions for valid payload', async () => {
      const payload = {
        sub: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
        roles: ['admin'],
        permissions: ['users:read', 'users:manage'],
      };
      authService.validateUser.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
      });

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
        roles: ['admin'],
        permissions: ['users:read', 'users:manage'],
      });
      expect(authService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('should throw UnauthorizedException when payload type is mfa-pending', async () => {
      const payload = { type: 'mfa-pending', sub: 'user-1' };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow('Complete MFA verification first');
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when validateUser returns null', async () => {
      const payload = { sub: 'user-1', email: 'joao@empresa.com', organizationId: 'org-123' };
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('should default roles and permissions to empty arrays when not in payload', async () => {
      const payload = { sub: 'user-1', email: 'joao@empresa.com', organizationId: 'org-123' };
      authService.validateUser.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
      });

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should pass the full payload to validateUser', async () => {
      const payload = {
        sub: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
        iat: 123456,
        exp: 789012,
      };
      authService.validateUser.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
      });

      await strategy.validate(payload);

      expect(authService.validateUser).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'joao@empresa.com',
        organizationId: 'org-123',
        iat: 123456,
        exp: 789012,
      });
    });
  });
});
