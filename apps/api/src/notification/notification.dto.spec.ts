import { describe, it, expect } from 'vitest';
import { NotificationFiltersDto } from './notification.dto';

describe('NotificationFiltersDto', () => {
  it('should be defined', () => {
    expect(new NotificationFiltersDto()).toBeDefined();
  });
});
