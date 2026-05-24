import { describe, it, expect } from 'vitest';
import { RedisModule } from './redis.module';

describe('RedisModule', () => {
  it('should be defined', () => {
    expect(new RedisModule()).toBeDefined();
  });
});
