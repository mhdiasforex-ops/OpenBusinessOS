import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventTypes } from '@openbusinessos/event-definitions';

@Injectable()
export class EventSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(EventSubscriberService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  onModuleInit() {
    // Subscribe to all event types and log them
    Object.values(EventTypes).forEach((type) => {
      this.eventEmitter.on(type, (payload: any) => {
        this.logger.log(`Event received: ${type} — org: ${payload.organizationId}`);
      });
    });
  }

  subscribe(eventType: string, handler: (payload: any) => Promise<void> | void) {
    this.eventEmitter.on(eventType, handler);
    this.logger.debug(`Subscribed to event: ${eventType}`);
  }
}
