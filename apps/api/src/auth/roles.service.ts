import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../common/tenant.service';

export const DEFAULT_ROLES: Record<string, { name: string; permissions: string[] }> = {
  owner: {
    name: 'owner',
    permissions: [
      'organization:manage', 'users:manage', 'users:read',
      'financial:manage', 'financial:read',
      'crm:manage', 'crm:read',
      'products:manage', 'products:read',
      'workflows:manage', 'workflows:read',
      'analytics:read', 'settings:manage',
    ],
  },
  admin: {
    name: 'admin',
    permissions: [
      'users:manage', 'users:read',
      'financial:manage', 'financial:read',
      'crm:manage', 'crm:read',
      'products:manage', 'products:read',
      'workflows:manage', 'workflows:read',
      'analytics:read',
    ],
  },
  manager: {
    name: 'manager',
    permissions: [
      'users:read', 'financial:read',
      'crm:manage', 'crm:read',
      'products:manage', 'products:read',
      'workflows:read', 'analytics:read',
    ],
  },
  viewer: {
    name: 'viewer',
    permissions: [
      'users:read', 'financial:read',
      'crm:read', 'products:read',
      'workflows:read', 'analytics:read',
    ],
  },
};

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async seedDefaultRoles(orgId: string) {
    for (const [, roleDef] of Object.entries(DEFAULT_ROLES)) {
      const existing = await this.prisma.role.findFirst({
        where: { name: roleDef.name, organizationId: orgId },
      });
      if (existing) continue;

      await this.prisma.role.create({
        data: {
          name: roleDef.name,
          organizationId: orgId,
          permissions: {
            create: roleDef.permissions.map((p) => {
              const [resource, action] = p.split(':');
              return { resource, action };
            }),
          },
        },
      });
    }
    this.logger.log(`Default roles seeded for org ${orgId}`);
  }

  async getRoles(orgId: string) {
    return this.prisma.role.findMany({
      where: { organizationId: orgId },
      include: { permissions: true, _count: { select: { users: true } } },
    });
  }

  async createRole(orgId: string, name: string, permissions: string[]) {
    return this.prisma.role.create({
      data: {
        name,
        organizationId: orgId,
        permissions: {
          create: permissions.map((p) => {
            const [resource, action] = p.split(':');
            return { resource, action };
          }),
        },
      },
      include: { permissions: true },
    });
  }

  async updateRole(roleId: string, orgId: string, permissions: string[]) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId },
    });
    if (!role) throw new NotFoundException('Role nao encontrada');

    await this.prisma.permission.deleteMany({ where: { roleId: role.id } });

    return this.prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          create: permissions.map((p) => {
            const [resource, action] = p.split(':');
            return { resource, action };
          }),
        },
      },
      include: { permissions: true },
    });
  }

  async deleteRole(roleId: string, orgId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: orgId },
    });
    if (!role) throw new NotFoundException('Role nao encontrada');
    if (role.name === 'owner') throw new Error('Cannot delete owner role');

    await this.prisma.role.delete({ where: { id: role.id } });
    return { message: 'Role removida' };
  }

  async assignRole(userId: string, roleId: string, orgId: string) {
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
    });
    if (existing) return existing;
    return this.prisma.userRole.create({ data: { userId, roleId } });
  }

  async revokeRole(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }
}
