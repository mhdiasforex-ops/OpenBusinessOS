import { describe, it, expect } from 'vitest';
import { CrmModule } from './crm.module';

describe('CrmModule', () => {
  it('should be defined', () => {
    expect(new CrmModule()).toBeDefined();
  });
});
