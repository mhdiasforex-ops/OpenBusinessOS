import { describe, it, expect } from 'vitest';
import { TenantModule } from './tenant.module';

describe('TenantModule', () => {
  it('should be defined', () => {
    expect(new TenantModule()).toBeDefined();
  });
});
