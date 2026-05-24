import { describe, it, expect } from 'vitest';
import { SuppliersModule } from './suppliers.module';

describe('SuppliersModule', () => {
  it('should be defined', () => {
    expect(new SuppliersModule()).toBeDefined();
  });
});
