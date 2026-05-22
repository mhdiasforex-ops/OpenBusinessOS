import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { EventSubscriberService } from './event-subscriber.service';
import { EventPersistenceService } from './event-persistence.service';
import { RedisEventBusService } from './redis-event-bus.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [EventBusService, EventSubscriberService, EventPersistenceService, RedisEventBusService],
  exports: [EventBusService, EventSubscriberService, RedisEventBusService],
})
export class EventsModule {}
