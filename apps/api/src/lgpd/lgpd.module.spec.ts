import { describe, it, expect } from 'vitest';
import { LgpdModule } from './lgpd.module';

describe('LgpdModule', () => {
  it('should be defined', () => {
    expect(new LgpdModule()).toBeDefined();
  });
});
