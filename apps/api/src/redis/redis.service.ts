import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private _client: Redis | null = null;
  private _connected = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    try {
      this._client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) {
            this.logger.warn('Redis max retry attempts reached — giving up');
            return null; // stop retrying
          }
          return Math.min(times * 200, 2000); // backoff: 200ms, 400ms, ... up to 2s
        },
        lazyConnect: true,
      });

      this._client.on('connect', () => {
        this._connected = true;
        this.logger.log('Redis connected');
      });

      this._client.on('ready', () => {
        this._connected = true;
        this.logger.log('Redis ready to accept commands');
      });

      this._client.on('error', (err) => {
        this.logger.error('Redis connection error', err.message);
      });

      this._client.on('close', () => {
        this._connected = false;
        this.logger.warn('Redis connection closed');
      });

      this._client.on('reconnecting', () => {
        this.logger.log('Redis reconnecting...');
      });

      await this._client.connect();
    } catch (err: any) {
      this.logger.warn(`Redis not available at ${redisUrl} — falling back to in-process only: ${err.message}`);
      this._connected = false;
      this._client = null;
    }
  }

  async onModuleDestroy() {
    if (this._client) {
      try {
        await this._client.quit();
        this.logger.log('Redis connection closed gracefully');
      } catch (err: any) {
        this.logger.warn('Error closing Redis connection', err.message);
        this._client.disconnect();
      }
    }
  }

  /** Get the ioredis client. Returns null if Redis is not connected. */
  getClient(): Redis | null {
    return this._connected ? this._client : null;
  }

  /** Create a new dedicated Redis connection (for pub/sub subscribers). */
  createDedicatedClient(): Redis | null {
    if (!this._client) return null;
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    try {
      return new Redis(redisUrl, {
        maxRetriesPerRequest: null, // subscribers should not limit retries
        lazyConnect: false,
      });
    } catch (err: any) {
      this.logger.warn('Failed to create dedicated Redis client', err.message);
      return null;
    }
  }

  isConnected(): boolean {
    return this._connected;
  }
}
