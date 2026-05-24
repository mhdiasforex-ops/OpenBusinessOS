import { describe, it, expect } from 'vitest';
import { RhModule } from './rh.module';

describe('RhModule', () => {
  it('should be defined', () => {
    expect(new RhModule()).toBeDefined();
  });
});
