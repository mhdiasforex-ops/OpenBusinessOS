import { describe, it, expect } from 'vitest';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentPeriodQueryDto, AppointmentListQueryDto } from './scheduler.dto';

describe('Scheduler DTOs', () => {
  it('CreateAppointmentDto should be defined', () => {
    expect(new CreateAppointmentDto()).toBeDefined();
  });
  it('UpdateAppointmentDto should be defined', () => {
    expect(new UpdateAppointmentDto()).toBeDefined();
  });
  it('AppointmentPeriodQueryDto should be defined', () => {
    expect(new AppointmentPeriodQueryDto()).toBeDefined();
  });
  it('AppointmentListQueryDto should be defined', () => {
    expect(new AppointmentListQueryDto()).toBeDefined();
  });
});
