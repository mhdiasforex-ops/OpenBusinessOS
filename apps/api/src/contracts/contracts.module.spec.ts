import { describe, it, expect } from 'vitest';
import { ContractsModule } from './contracts.module';

describe('ContractsModule', () => {
  it('should be defined', () => {
    expect(new ContractsModule()).toBeDefined();
  });
});
