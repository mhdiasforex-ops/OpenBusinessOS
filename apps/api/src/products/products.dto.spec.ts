import { describe, it, expect } from 'vitest';
import { CreateProductDto, UpdateProductDto } from './products.dto';

describe('Products DTOs', () => {
  it('CreateProductDto should be defined', () => {
    expect(new CreateProductDto()).toBeDefined();
  });
  it('UpdateProductDto should be defined', () => {
    expect(new UpdateProductDto()).toBeDefined();
  });
});
