import { describe, it, expect } from 'vitest';
import { ReportsModule } from './reports.module';

describe('ReportsModule', () => {
  it('should be defined', () => {
    expect(new ReportsModule()).toBeDefined();
  });
});
