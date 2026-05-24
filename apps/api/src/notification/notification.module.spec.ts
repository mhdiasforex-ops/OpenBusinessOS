import { describe, it, expect } from 'vitest';
import { NotificationModule } from './notification.module';

describe('NotificationModule', () => {
  it('should be defined', () => {
    expect(new NotificationModule()).toBeDefined();
  });
});
