import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationFiltersDto } from './notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async list(orgId: string, userId: string, filters: NotificationFiltersDto) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const where: any = { organizationId: orgId, userId };

    if (filters.type) where.type = filters.type;
    if (filters.read !== undefined) where.read = filters.read;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async markAsRead(id: string, orgId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
    if (!notif) throw new NotFoundException('Notificação não encontrada');
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead(orgId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { organizationId: orgId, userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }

  async remove(id: string, orgId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, organizationId: orgId } });
    if (!notif) throw new NotFoundException('Notificação não encontrada');
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }
}
