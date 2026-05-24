import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(() => {
    authService = {
      register: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
      login: vi.fn().mockResolvedValue({ accessToken: 'token-123' }),
      verifyMfa: vi.fn().mockResolvedValue({ accessToken: 'token-456' }),
      getProfile: vi.fn().mockResolvedValue({ id: 'user-1', name: 'John' }),
      enableMfa: vi.fn().mockResolvedValue({ secret: 'abc123' }),
      disableMfa: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new AuthController(authService);
  });

  it('should call register with dto', async () => {
    const dto = { email: 'test@test.com', password: '123456', name: 'John', organizationName: 'Acme' };
    const result = await controller.register(dto);
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'user-1', email: 'test@test.com' });
  });

  it('should call login with dto', async () => {
    const dto = { email: 'test@test.com', password: '123456' };
    const result = await controller.login(dto);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'token-123' });
  });

  it('should call verifyMfa with dto', async () => {
    const dto = { email: 'test@test.com', code: '000000' };
    const result = await controller.verifyMfa(dto);
    expect(authService.verifyMfa).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ accessToken: 'token-456' });
  });

  it('should call getProfile with user id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getProfile(req);
    expect(authService.getProfile).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ id: 'user-1', name: 'John' });
  });

  it('should call enableMfa with user id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.enableMfa(req);
    expect(authService.enableMfa).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ secret: 'abc123' });
  });

  it('should call disableMfa with user id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.disableMfa(req);
    expect(authService.disableMfa).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ success: true });
  });
});
