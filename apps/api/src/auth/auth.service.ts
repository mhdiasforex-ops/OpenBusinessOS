import { Injectable, UnauthorizedException, ConflictException, Logger, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../common/tenant.service';
import { Niche } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { RegisterDto, LoginDto, MfaVerifyDto } from './auth.dto';
import { RolesService } from './roles.service';
import { EventBusService, EventPayload } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private tenant: TenantService,
    private rolesService: RolesService,
    @Optional() private eventBus: EventBusService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    // Create organization
    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        slug: this.generateSlug(dto.organizationName),
        niche: (dto.niche || 'OTHER') as Niche,
        plan: 'FREE',
      },
    });

    // Seed default roles for this organization
    await this.rolesService.seedDefaultRoles(org.id);

    // Get owner role
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'owner', organizationId: org.id },
    });

    // Create user with owner role
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        organizationId: org.id,
        email: dto.email,
        name: dto.name,
        passwordHash,
        roles: {
          create: { roleId: ownerRole!.id },
        },
      },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
      },
    });

    const token = this.generateToken(user);

    // Emit ORG_CREATED event
    if (this.eventBus) {
      this.eventBus.emit({
        organizationId: org.id,
        type: EventTypes.ORG_CREATED,
        source: 'auth.service',
        payload: { name: org.name, niche: org.niche, ownerEmail: dto.email },
      }).catch((err: any) => this.logger.warn('Failed to emit ORG_CREATED', err?.message));

      // Emit USER_REGISTERED event
      this.eventBus.emit({
        organizationId: org.id,
        type: EventTypes.USER_REGISTERED,
        source: 'auth.service',
        payload: { userId: user.id, email: user.email, name: user.name },
      }).catch((err: any) => this.logger.warn('Failed to emit USER_REGISTERED', err?.message));
    }

    this.logger.log(`User registered: ${dto.email} for org: ${org.slug}`);

    return {
      user: this.sanitizeUser(user),
      organization: org,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        organization: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.mfaEnabled) {
      return { requiresMfa: true, userId: user.id, tempToken: this.generateTempToken(user) };
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      accessToken: token,
    };
  }

  async verifyMfa(dto: MfaVerifyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        organization: true,
      },
    });

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('MFA não configurado');
    }

    const valid = authenticator.verify({ token: dto.code, secret: user.mfaSecret });
    if (!valid) {
      throw new UnauthorizedException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      accessToken: this.generateToken(user),
    };
  }

  async enableMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret, mfaEnabled: true },
    });

    const otpauth = authenticator.keyuri(user.email, 'OpenBusinessOS', secret);
    return { secret, otpauth };
  }

  async disableMfa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null, mfaEnabled: false },
    });
    return { message: 'MFA desabilitado' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        organization: true,
      },
    });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    return this.sanitizeUser(user);
  }

  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
      },
    });
    if (!user || !user.isActive) return null;
    return user;
  }

  private generateToken(user: any): string {
    const permissions = user.roles?.flatMap((ur: any) =>
      ur.role.permissions.map((p: any) => `${p.resource}:${p.action}`),
    ) || [];
    const roles = user.roles?.map((ur: any) => ur.role.name) || [];

    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles,
      permissions,
    });
  }

  private generateTempToken(user: any): string {
    return this.jwt.sign(
      { sub: user.id, type: 'mfa-pending' },
      { expiresIn: '5m' },
    );
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
  }
}
