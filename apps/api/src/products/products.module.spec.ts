import { describe, it, expect } from 'vitest';
import { ProductsModule } from './products.module';

describe('ProductsModule', () => {
  it('should be defined', () => {
    expect(new ProductsModule()).toBeDefined();
  });
});
