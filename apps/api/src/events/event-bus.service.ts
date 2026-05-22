import { Injectable, Logger, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisEventBusService } from './redis-event-bus.service';

export interface EventPayload {
  organizationId: string;
  type: string;
  source: string;
  payload: Record<string, any>;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
    @Optional() private redisBus: RedisEventBusService,
  ) {}

  async emit(event: EventPayload): Promise<void> {
    // Persist event
    const record = await this.prisma.event.create({
      data: {
        organizationId: event.organizationId,
        type: event.type,
        source: event.source,
        payload: event.payload as any,
        status: 'PENDING',
      },
    });

  // Publish via Redis (cross-instance) using per-type channel
  if (this.redisBus) {
    await this.redisBus.publish(event.type, {
      eventId: record.id,
      ...event,
    }).catch((err: any) => {
      this.logger.warn('Redis publish failed, using local only', err?.message);
    });
  }

    // Also emit locally for same-process handlers
    this.eventEmitter.emit(event.type, event);

    this.logger.debug(`Event emitted: ${event.type} for org ${event.organizationId}`);

    // Mark as processed
    await this.prisma.event.update({
      where: { id: record.id },
      data: { processedAt: new Date(), status: 'PROCESSED' },
    }).catch(() => {
      this.logger.warn(`Failed to mark event ${record.id} as processed`);
    });
  }

  async getEvents(orgId: string, type?: string, limit = 50) {
    return this.prisma.event.findMany({
      where: { organizationId: orgId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
