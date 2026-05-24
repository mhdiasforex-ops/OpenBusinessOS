import { describe, it, expect } from 'vitest';
import { InventoryModule } from './inventory.module';

describe('InventoryModule', () => {
  it('should be defined', () => {
    expect(new InventoryModule()).toBeDefined();
  });
});
