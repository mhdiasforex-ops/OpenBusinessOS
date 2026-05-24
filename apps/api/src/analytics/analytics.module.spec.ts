import { describe, it, expect } from 'vitest';
import { AnalyticsModule } from './analytics.module';

describe('AnalyticsModule', () => {
  it('should be defined', () => {
    expect(new AnalyticsModule()).toBeDefined();
  });
});
