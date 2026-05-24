import { describe, it, expect } from 'vitest';
import { EventsModule } from './events.module';

describe('EventsModule', () => {
  it('should be defined', () => {
    expect(new EventsModule()).toBeDefined();
  });
});
