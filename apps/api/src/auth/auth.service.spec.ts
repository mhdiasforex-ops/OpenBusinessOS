import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../common/tenant.service';
import { RolesService } from './roles.service';
import { RegisterDto, LoginDto } from './auth.dto';
import * as bcrypt from 'bcryptjs';

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
  });
});
