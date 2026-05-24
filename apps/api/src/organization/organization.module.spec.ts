import { describe, it, expect } from 'vitest';
import { OrganizationModule } from './organization.module';

describe('OrganizationModule', () => {
  it('should be defined', () => {
    expect(new OrganizationModule()).toBeDefined();
  });
});
