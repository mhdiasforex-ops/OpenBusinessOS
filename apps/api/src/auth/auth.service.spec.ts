import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../common/tenant.service';
import { RolesService } from './roles.service';
import { RegisterDto, LoginDto, MfaVerifyDto } from './auth.dto';
import * as bcrypt from 'bcryptjs';

vi.mock('otplib', () => ({
  authenticator: {
    verify: vi.fn().mockReturnValue(true),
    generateSecret: vi.fn().mockReturnValue('MOCK_SECRET'),
    keyuri: vi.fn().mockReturnValue('otpauth://totp/test'),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let tenant: any;
  let rolesService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      organization: {
        create: vi.fn(),
      },
      role: { findFirst: vi.fn() },
    };
    jwt = { sign: vi.fn().mockReturnValue('jwt-token-123') };
    tenant = { getOrgId: vi.fn().mockReturnValue('org-123') };
    rolesService = { seedDefaultRoles: vi.fn() };

    service = new AuthService(prisma, jwt, tenant, rolesService, null as any);
  });

  describe('register', () => {
    const dto: RegisterDto = {
      name: 'João Silva',
      email: 'joao@empresa.com',
      password: 'minhaSenha123',
      organizationName: 'Minha Empresa',
    };

    it('should create org + user + return token on successful registration', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({ id: 'org-new', name: 'Minha Empresa', slug: 'minha-empresa', niche: 'OTHER', plan: 'FREE' });
      prisma.role.findFirst.mockResolvedValue({ id: 'role-owner' });
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        name: dto.name,
        roles: [{ role: { name: 'owner', permissions: [] } }],
      });

      const result = await service.register(dto);

      expect(prisma.organization.create).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing-user', email: dto.email });

      await expect(service.register(dto)).rejects.toThrow('Email já cadastrado');
    });

    it('should hash the password with bcrypt', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({ id: 'org-new', name: 'Test', slug: 'test', niche: 'OTHER', plan: 'FREE' });
      prisma.role.findFirst.mockResolvedValue({ id: 'role-owner' });
      prisma.user.create.mockImplementation(async (args: any) => ({
        id: 'user-1',
        email: dto.email,
        ...args.data,
        roles: [{ role: { permissions: [] } }],
        organization: { id: 'org-new' },
      }));

      await service.register(dto);

      const createCall = prisma.user.create.mock.calls[0][0];
      const hashArg = createCall.data.passwordHash;
      // bcrypt hash starts with $2a$ or $2b$
      expect(hashArg).toMatch(/^\$2[ab]\$/);
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'joao@empresa.com', password: 'minhaSenha123' };

    it('should return token on valid credentials', async () => {
      const hash = await bcrypt.hash(dto.password, 12);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: hash,
        isActive: true,
        mfaEnabled: false,
        organizationId: 'org-123',
        roles: [{ role: { name: 'owner', permissions: [] } }],
        organization: { id: 'org-123', name: 'Test Org' },
      });
      prisma.user.update.mockResolvedValue({ id: 'user-1', lastLoginAt: new Date() });

      const result = await service.login(dto);
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('senhaErrada', 12);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: hash,
        isActive: true,
        mfaEnabled: false,
        organizationId: 'org-123',
        roles: [{ role: { name: 'owner', permissions: [] } }],
        organization: { id: 'org-123', name: 'Test Org' },
      });

      await expect(service.login(dto)).rejects.toThrow();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow();
    });
  });

  describe('generateSlug', () => {
    it('should convert organization name to URL-friendly slug with random suffix', () => {
      const slug = (service as any).generateSlug('Minha Empresa LTDA!!!');
      expect(slug).toMatch(/^minha-empresa-ltda-[a-z0-9]{4}$/);
    });

    it('should remove accents and collapse special chars', () => {
      const slug = (service as any).generateSlug('João & Silva Ltda');
      expect(slug).toMatch(/^joao-silva-ltda-[a-z0-9]{4}$/);
    });

    it('should handle whitespace-only names', () => {
      const slug = (service as any).generateSlug('   ');
      expect(slug).toMatch(/^--[a-z0-9]{4}$/);
    });
  });

  describe('verifyMfa', () => {
    const mfaDto: MfaVerifyDto = { userId: 'user-1', code: '123456' };

    it('should verify valid MFA code and return token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        mfaSecret: 'mocked-secret',
        isActive: true,
        organizationId: 'org-123',
        roles: [{ role: { name: 'owner', permissions: [] } }],
        organization: { id: 'org-123', name: 'Test Org' },
      });

      const result = await service.verifyMfa(mfaDto);
      expect(result.accessToken).toBe('jwt-token-123');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyMfa(mfaDto)).rejects.toThrow('MFA não configurado');
    });

    it('should throw UnauthorizedException when mfaSecret is null', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', mfaSecret: null });
      await expect(service.verifyMfa(mfaDto)).rejects.toThrow('MFA não configurado');
    });

    it('should throw UnauthorizedException when code is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', mfaSecret: 'secret' });
      const { authenticator } = await import('otplib');
      (authenticator.verify as any).mockReturnValueOnce(false);
      await expect(service.verifyMfa(mfaDto)).rejects.toThrow('Código MFA inválido');
    });
  });

  describe('enableMfa', () => {
    it('should enable MFA and return secret and otpauth', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'joao@empresa.com' });

      const result = await service.enableMfa('user-1');
      expect(result.secret).toBe('MOCK_SECRET');
      expect(result.otpauth).toBe('otpauth://totp/test');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { mfaSecret: 'MOCK_SECRET', mfaEnabled: true },
      });
    });

    it('should throw when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.enableMfa('nonexistent')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA and clear secret', async () => {
      prisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.disableMfa('user-1');
      expect(result.message).toBe('MFA desabilitado');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { mfaSecret: null, mfaEnabled: false },
      });
    });
  });

  describe('getProfile', () => {
    it('should return sanitized user profile', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'joao@empresa.com',
        name: 'João',
        passwordHash: 'secret',
        mfaSecret: 'mfa-secret',
        isActive: true,
        organizationId: 'org-123',
        roles: [{ role: { name: 'owner', permissions: [] } }],
        organization: { id: 'org-123', name: 'Test Org' },
      });

      const result = await service.getProfile('user-1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('mfaSecret');
      expect(result.email).toBe('joao@empresa.com');
    });

    it('should throw when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('nonexistent')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('validateUser', () => {
    it('should return user when found and active', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true, roles: [] });
      const result = await service.validateUser({ sub: 'user-1' });
      expect(result).toBeDefined();
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser({ sub: 'nonexistent' });
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: false, roles: [] });
      const result = await service.validateUser({ sub: 'user-1' });
      expect(result).toBeNull();
    });
  });
});
