import { describe, it, expect } from 'vitest';
import { SalesModule } from './sales.module';

describe('SalesModule', () => {
  it('should be defined', () => {
    expect(new SalesModule()).toBeDefined();
  });
});
