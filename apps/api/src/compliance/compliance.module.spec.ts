import { describe, it, expect } from 'vitest';
import { ComplianceModule } from './compliance.module';

describe('ComplianceModule', () => {
  it('should be defined', () => {
    expect(new ComplianceModule()).toBeDefined();
  });
});
