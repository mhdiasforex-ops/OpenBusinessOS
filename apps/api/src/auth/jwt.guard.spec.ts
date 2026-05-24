import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtGuard } from './jwt.guard';
import { IS_PUBLIC_KEY } from '../common/guards';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let mockContext: any;
  let parentCanActivateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() };
    guard = new JwtGuard(reflector as any);
    mockContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
    };
    parentCanActivateSpy = vi.fn().mockReturnValue(true);
    const parentProto = Object.getPrototypeOf(JwtGuard.prototype);
    vi.spyOn(parentProto, 'canActivate').mockImplementation(parentCanActivateSpy);
  });

  describe('canActivate', () => {
    it('should return true and skip AuthGuard when @Public() decorator is present', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(parentCanActivateSpy).not.toHaveBeenCalled();
    });

    it('should call super.canActivate when isPublic is false', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(parentCanActivateSpy).toHaveBeenCalledTimes(1);
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should call super.canActivate when reflector returns undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should call super.canActivate when reflector returns null', () => {
      reflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockContext);
    });
  });
});
