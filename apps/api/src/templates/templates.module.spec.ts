import { describe, it, expect } from 'vitest';
import { TemplatesModule } from './templates.module';

describe('TemplatesModule', () => {
  it('should be defined', () => {
    expect(new TemplatesModule()).toBeDefined();
  });
});
