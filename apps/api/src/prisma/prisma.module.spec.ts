import { describe, it, expect } from 'vitest';
import { PrismaModule } from './prisma.module';

describe('PrismaModule', () => {
  it('should be defined', () => {
    expect(new PrismaModule()).toBeDefined();
  });
});
