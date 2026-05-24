import { describe, it, expect } from 'vitest';
import { CreateReportDto, UpdateReportDto, ReportListQueryDto } from './reports.dto';

describe('Reports DTOs', () => {
  it('CreateReportDto should be defined', () => {
    expect(new CreateReportDto()).toBeDefined();
  });
  it('UpdateReportDto should be defined', () => {
    expect(new UpdateReportDto()).toBeDefined();
  });
  it('ReportListQueryDto should be defined', () => {
    expect(new ReportListQueryDto()).toBeDefined();
  });
});
