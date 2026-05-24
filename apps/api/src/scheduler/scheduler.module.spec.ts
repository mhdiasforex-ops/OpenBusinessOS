import { describe, it, expect } from 'vitest';
import { SchedulerModule } from './scheduler.module';

describe('SchedulerModule', () => {
  it('should be defined', () => {
    expect(new SchedulerModule()).toBeDefined();
  });
});
