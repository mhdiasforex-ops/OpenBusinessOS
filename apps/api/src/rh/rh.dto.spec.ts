import { describe, it, expect } from 'vitest';
import { CreateEmployeeDto, UpdateEmployeeDto, CreateTimeEntryDto, CreatePayrollDto, CreateLeaveRequestDto } from './rh.dto';

describe('RH DTOs', () => {
  it('CreateEmployeeDto should be defined', () => {
    expect(new CreateEmployeeDto()).toBeDefined();
  });
  it('UpdateEmployeeDto should be defined', () => {
    expect(new UpdateEmployeeDto()).toBeDefined();
  });
  it('CreateTimeEntryDto should be defined', () => {
    expect(new CreateTimeEntryDto()).toBeDefined();
  });
  it('CreatePayrollDto should be defined', () => {
    expect(new CreatePayrollDto()).toBeDefined();
  });
  it('CreateLeaveRequestDto should be defined', () => {
    expect(new CreateLeaveRequestDto()).toBeDefined();
  });
});
