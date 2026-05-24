import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from './decorators';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockContext: any;
  let mockRequest: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
    mockRequest = { user: null };
    mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    };
  });

  describe('when no permissions are required', () => {
    it('returns true when metadata is undefined', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true when metadata is null', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true when metadata is an empty array', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });

  describe('when permissions are required', () => {
    beforeEach(() => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['reports:read']);
    });

    it('throws ForbiddenException when user has no permissions property', () => {
      mockRequest.user = {};
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user permissions is null', () => {
      mockRequest.user = { permissions: null };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user permissions is undefined', () => {
      mockRequest.user = { permissions: undefined };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user has no permissions', () => {
      mockRequest.user = { permissions: [] };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user lacks the required permission', () => {
      mockRequest.user = { permissions: ['other:read'] };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException with the correct message when no permissions', () => {
      mockRequest.user = { permissions: [] };
      expect(() => guard.canActivate(mockContext)).toThrow('Acesso negado');
    });

    it('throws ForbiddenException with insufficient permission message when user has some permissions but not the required one', () => {
      mockRequest.user = { permissions: ['other:read'] };
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Acesso negado: permissão insuficiente',
      );
    });

    it('returns true when user has exact required permission', () => {
      mockRequest.user = { permissions: ['reports:read'] };
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true when user has manage permission for the same resource', () => {
      mockRequest.user = { permissions: ['reports:manage'] };
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true when user has manage permission for the same resource among many', () => {
      mockRequest.user = { permissions: ['other:read', 'reports:manage', 'other:write'] };
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true when user has exact permission among many', () => {
      mockRequest.user = { permissions: ['other:read', 'reports:read', 'other:write'] };
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true for multiple required permissions all satisfied by exact match', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        'reports:read',
        'users:write',
      ]);
      mockRequest.user = { permissions: ['reports:read', 'users:write'] };
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('returns true when one required permission is satisfied by manage wildcard and another by exact match', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        'reports:read',
        'users:delete',
      ]);
      mockRequest.user = { permissions: ['reports:manage', 'users:delete'] };
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('throws ForbiddenException when user has manage for a different resource', () => {
      mockRequest.user = { permissions: ['other:manage'] };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when one of multiple required permissions is missing', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        'reports:read',
        'users:write',
      ]);
      mockRequest.user = { permissions: ['reports:read'] };
      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    describe('edge cases with manage wildcard', () => {
      it('manage != read when there is no colon separator', () => {
        mockRequest.user = { permissions: ['reportsmanage'] };
        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      });

      it('manage does not match a permission with the same suffix but different resource', () => {
        mockRequest.user = { permissions: ['other:manage'] };
        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      });

      it('required permission "resource:manage" is NOT satisfied by having "resource:read"', () => {
        vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['reports:manage']);
        mockRequest.user = { permissions: ['reports:read'] };
        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      });
    });
  });
});
