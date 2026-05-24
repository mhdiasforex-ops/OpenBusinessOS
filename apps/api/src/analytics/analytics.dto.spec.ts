import { describe, it, expect } from 'vitest';
import { DateRangeDto, MetricsQueryDto } from './analytics.dto';

describe('Analytics DTOs', () => {
  it('DateRangeDto should be defined', () => {
    expect(new DateRangeDto()).toBeDefined();
  });
  it('MetricsQueryDto should be defined', () => {
    expect(new MetricsQueryDto()).toBeDefined();
  });
});
