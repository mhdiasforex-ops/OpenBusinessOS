import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, UpdateUserRoleDto, UserFiltersDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // LIST — listar usuários da organização
  // ──────────────────────────────────────────────

  async getUsers(orgId: string, filters: UserFiltersDto) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId, isActive: true };

    if (filters.roleId) {
      where.roles = { some: { roleId: filters.roleId } };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              role: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  // ──────────────────────────────────────────────
  // PROFILE — perfil do usuário logado
  // ──────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: {
                  select: { resource: true, action: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    // Flatten roles and permissions
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((p) => `${p.resource}:${p.action}`),
    );

    const { roles: _userRoles, ...rest } = user;
    return { ...rest, roles, permissions };
  }

  // ──────────────────────────────────────────────
  // UPDATE PROFILE — atualizar nome e telefone
  // ──────────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ──────────────────────────────────────────────
  // UPDATE ROLE — alterar cargo do usuário (admin)
  // ──────────────────────────────────────────────

  async updateUserRole(orgId: string, targetUserId: string, dto: UpdateUserRoleDto, adminUserId: string) {
    // Verificar se o usuário alvo existe e pertence à org
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId: orgId },
      include: { roles: true },
    });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');

    // Verificar se a role pertence à organização
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, organizationId: orgId },
    });
    if (!role) throw new NotFoundException('Cargo não encontrado nesta organização');

    // Não permitir alterar o próprio cargo
    if (targetUserId === adminUserId) {
      throw new ForbiddenException('Você não pode alterar seu próprio cargo');
    }

    // Remover roles antigas e criar nova
    await this.prisma.userRole.deleteMany({
      where: { userId: targetUserId },
    });

    await this.prisma.userRole.create({
      data: {
        userId: targetUserId,
        roleId: dto.roleId,
      },
    });

    return this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  // ──────────────────────────────────────────────
  // DELETE — remover (desativar) usuário (admin)
  // ──────────────────────────────────────────────

  async deleteUser(orgId: string, targetUserId: string, adminUserId: string) {
    // Verificar se o usuário alvo existe e pertence à org
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId: orgId },
    });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');

    // Não permitir remover a si mesmo
    if (targetUserId === adminUserId) {
      throw new ForbiddenException('Você não pode remover seu próprio usuário');
    }

    // Soft delete — desativar em vez de excluir
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    return { message: 'Usuário removido com sucesso' };
  }
}
