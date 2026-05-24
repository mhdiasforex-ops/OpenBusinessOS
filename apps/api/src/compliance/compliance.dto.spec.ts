import { describe, it, expect } from 'vitest';
import { CreateComplianceRecordDto, UpdateComplianceRecordDto } from './compliance.dto';

describe('Compliance DTOs', () => {
  it('CreateComplianceRecordDto should be defined', () => {
    expect(new CreateComplianceRecordDto()).toBeDefined();
  });
  it('UpdateComplianceRecordDto should be defined', () => {
    expect(new UpdateComplianceRecordDto()).toBeDefined();
  });
});
