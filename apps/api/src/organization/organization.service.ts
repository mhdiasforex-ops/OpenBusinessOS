import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../common/tenant.service';
import { Niche } from '@prisma/client';
import { UpdateOrganizationDto, AddMemberDto } from './organization.dto';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organização não encontrada');
    }

    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      throw new NotFoundException('Organização não encontrada');
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organização não encontrada');
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        niche: dto.niche ? (dto.niche as Niche) : undefined,
        settings: dto.settings ? dto.settings : undefined,
      },
    });
  }

  async getMembers(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        roles: { include: { role: { select: { name: true } } } },
      },
    });
  }

  async addMember(orgId: string, dto: AddMemberDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, organizationId: orgId },
    });

    if (existing) {
      throw new ForbiddenException('Membro já existe nesta organização');
    }

    const role = await this.prisma.role.findFirst({
      where: { name: dto.roleName, organizationId: orgId },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrada');
    }

    const passwordHash = await import('bcryptjs').then((b) => b.hash(dto.password, 12));

    const user = await this.prisma.user.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        roles: { create: { roleId: role.id } },
      },
      include: { roles: { include: { role: true } } },
    });

    this.logger.log(`Member added: ${dto.email} to org ${orgId}`);
    return user;
  }

  async removeMember(orgId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });

    if (!user) {
      throw new NotFoundException('Membro não encontrado');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    this.logger.log(`Member removed: ${userId} from org ${orgId}`);
    return { message: 'Membro removido' };
  }

  async getStats(orgId: string) {
    const [users, products, customers, transactions, workflows] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.product.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.customer.count({ where: { organizationId: orgId } }),
      this.prisma.transaction.count({ where: { organizationId: orgId } }),
      this.prisma.workflow.count({ where: { organizationId: orgId, isActive: true } }),
    ]);

    return { users, products, customers, transactions, workflows };
  }
}
