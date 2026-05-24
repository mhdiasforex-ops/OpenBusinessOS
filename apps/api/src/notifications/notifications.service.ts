import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationFiltersDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(
    orgId: string,
    userId: string,
    filters: NotificationFiltersDto,
  ) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId, userId };
    if (filters.read !== undefined) where.read = filters.read;
    if (filters.type) where.type = filters.type as NotificationType;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async markAsRead(id: string, orgId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, organizationId: orgId, userId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(orgId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { organizationId: orgId, userId, read: false },
      data: { read: true },
    });

    return { message: `${result.count} notificações marcadas como lidas`, count: result.count };
  }

  async remove(id: string, orgId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, organizationId: orgId, userId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notificação removida' };
  }
}
