import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Optional } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../redis/redis.service';
import Redis from 'ioredis';

/** Channel prefix for all BusinessOS event channels */
const CHANNEL_PREFIX = 'obos:events:';

/** Subscribe pattern to catch all event types */
const CHANNEL_PATTERN = 'obos:events:*';

@Injectable()
export class RedisEventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventBusService.name);

  /** Dedicated subscriber connection (must be separate from publisher) */
  private subscriberClient: Redis | null = null;

  /** Track active subscriptions by event type */
  private activeSubscriptions = new Map<string, Set<(data: any) => void>>();

  constructor(
    private eventEmitter: EventEmitter2,
    @Optional() private redisService: RedisService,
  ) {}

  async onModuleInit() {
    if (!this.redisService || !this.redisService.isConnected()) {
      this.logger.warn('Redis unavailable — event bus running in local-only mode');
      return;
    }

    try {
      // Create a dedicated subscriber connection
      this.subscriberClient = this.redisService.createDedicatedClient();

      if (!this.subscriberClient) {
        this.logger.warn('Could not create subscriber connection — event bus in local-only mode');
        return;
      }

      // Wait for subscriber to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Subscriber connection timeout')), 5000);

        if (this.subscriberClient!.status === 'ready') {
          clearTimeout(timeout);
          resolve();
        } else {
          this.subscriberClient!.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
          this.subscriberClient!.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });

      // Subscribe to all event types using psubscribe (pattern-based)
      this.subscriberClient.on('pmessage', (pattern: string, channel: string, message: string) => {
        this.handleMessage(channel, message);
      });

      await this.subscriberClient.psubscribe(CHANNEL_PATTERN);
      this.logger.log(`Redis Event Bus subscribed to pattern: ${CHANNEL_PATTERN}`);
    } catch (err: any) {
      this.logger.warn(`Redis subscriber init failed — falling back to in-process events: ${err.message}`);
      this.subscriberClient = null;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.subscriberClient) {
        await this.subscriberClient.punsubscribe(CHANNEL_PATTERN).catch(() => {});
        await this.subscriberClient.quit().catch(() => {
          this.subscriberClient?.disconnect();
        });
        this.subscriberClient = null;
      }
    } catch (err: any) {
      this.logger.warn('Error during Redis Event Bus shutdown', err.message);
    }
  }

  /**
   * Publish an event to Redis channel `obos:events:{type}`.
   * Falls back to local EventEmitter2 if Redis is unavailable.
   */
  async publish(type: string, data: any): Promise<void> {
    const channel = `${CHANNEL_PREFIX}${type}`;
    const payload = JSON.stringify(data);

    const client = this.redisService?.getClient();

    if (client && this.redisService?.isConnected()) {
      try {
        const receivers = await client.publish(channel, payload);
        this.logger.debug(
          `Published event to channel "${channel}" — ${receivers} receiver(s)`,
        );
      } catch (err: any) {
        this.logger.error(
          `Redis publish failed for channel "${channel}": ${err.message}`,
        );
        // Fallback: emit locally
        this.eventEmitter.emit(type, data);
      }
    } else {
      // No Redis — emit locally as fallback
      this.logger.debug(`Redis unavailable — emitting event "${type}" locally only`);
      this.eventEmitter.emit(type, data);
    }
  }

  /**
   * Subscribe to events of a specific type via Redis + local EventEmitter2.
   * Returns an unsubscribe function.
   */
  subscribe(eventType: string, handler: (data: any) => Promise<void> | void): () => void {
    // Register handler in local EventEmitter2 for same-process delivery
    this.eventEmitter.on(eventType, handler as any);

    // Track subscription
    if (!this.activeSubscriptions.has(eventType)) {
      this.activeSubscriptions.set(eventType, new Set());
    }
    this.activeSubscriptions.get(eventType)!.add(handler);

    this.logger.debug(`Subscribed to event type: ${eventType}`);

    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(eventType, handler as any);
      const handlers = this.activeSubscriptions.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.activeSubscriptions.delete(eventType);
        }
      }
      this.logger.debug(`Unsubscribed from event type: ${eventType}`);
    };
  }

  /**
   * Register a one-time handler for a specific event type.
   */
  onEvent(eventType: string, handler: (data: any) => Promise<void> | void): () => void {
    const wrappedHandler = async (data: any) => {
      try {
        await handler(data);
      } catch (err: any) {
        this.logger.error(`Error in onEvent handler for "${eventType}": ${err.message}`);
      }
    };

    this.eventEmitter.once(eventType, wrappedHandler as any);
    this.logger.debug(`Registered one-time handler for event: ${eventType}`);

    return () => {
      this.eventEmitter.off(eventType, wrappedHandler as any);
    };
  }

  /**
   * Handle incoming messages from Redis subscriber.
   */
  private handleMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);
      const eventType = channel.replace(CHANNEL_PREFIX, '');

      this.logger.debug(`Received event from Redis channel "${channel}" (type: ${eventType})`);

      // Re-emit locally so all in-process handlers receive it
      this.eventEmitter.emit(eventType, data);
    } catch (err: any) {
      this.logger.error(`Failed to process Redis message on channel "${channel}": ${err.message}`);
    }
  }

  /**
   * Check if Redis is connected and available.
   */
  isConnected(): boolean {
    return !!(this.redisService?.isConnected() && this.subscriberClient);
  }

  /**
   * Get the number of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.activeSubscriptions.size;
  }
}
