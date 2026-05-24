import { describe, it, expect } from 'vitest';
import { NotificationsModule } from './notifications.module';

describe('NotificationsModule', () => {
  it('should be defined', () => {
    expect(new NotificationsModule()).toBeDefined();
  });
});
