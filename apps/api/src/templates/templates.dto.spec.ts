import { describe, it, expect } from 'vitest';
import { CreateTemplateDto, UpdateTemplateDto } from './templates.dto';

describe('Templates DTOs', () => {
  it('CreateTemplateDto should be defined', () => {
    expect(new CreateTemplateDto()).toBeDefined();
  });
  it('UpdateTemplateDto should be defined', () => {
    expect(new UpdateTemplateDto()).toBeDefined();
  });
});
