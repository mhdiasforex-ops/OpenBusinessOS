import { describe, it, expect } from 'vitest';
import { OmnichannelModule } from './omnichannel.module';

describe('OmnichannelModule', () => {
  it('should be defined', () => {
    expect(new OmnichannelModule()).toBeDefined();
  });
});
