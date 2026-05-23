import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() };
    guard = new RolesGuard(reflector);
  });

  const mockContext = (user: any = {}) => ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

  it('should allow access when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow access when required roles empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = mockContext({ roles: ['admin', 'user'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user has no roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = mockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const ctx = mockContext({ roles: ['user'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
