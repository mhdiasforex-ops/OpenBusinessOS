import { describe, it, expect } from 'vitest';
import { UsersModule } from './users.module';

describe('UsersModule', () => {
  it('should be defined', () => {
    expect(new UsersModule()).toBeDefined();
  });
});
