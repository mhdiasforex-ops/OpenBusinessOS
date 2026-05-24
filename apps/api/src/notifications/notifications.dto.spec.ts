import { describe, it, expect } from 'vitest';
import { NotificationFiltersDto } from './notifications.dto';

describe('NotificationsFiltersDto', () => {
  it('should be defined', () => {
    expect(new NotificationFiltersDto()).toBeDefined();
  });
});
