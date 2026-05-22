import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventPersistenceService {
  private readonly logger = new Logger(EventPersistenceService.name);

  constructor(private prisma: PrismaService) {}

  async markFailed(eventId: string, error: string) {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'FAILED' },
    });
    this.logger.error(`Event ${eventId} failed: ${error}`);
  }

  async retryPending(orgId: string) {
    const pending = await this.prisma.event.findMany({
      where: { organizationId: orgId, status: 'FAILED' },
      take: 100,
      orderBy: { createdAt: 'asc' },
    });

    this.logger.log(`Found ${pending.length} failed events to retry for org ${orgId}`);
    return pending;
  }
}
