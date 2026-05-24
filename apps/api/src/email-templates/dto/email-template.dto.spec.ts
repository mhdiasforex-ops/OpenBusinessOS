import { describe, it, expect } from 'vitest';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, PreviewEmailTemplateDto } from './email-template.dto';

describe('EmailTemplate DTO', () => {
  it('CreateEmailTemplateDto should be defined', () => {
    expect(new CreateEmailTemplateDto()).toBeDefined();
  });
  it('UpdateEmailTemplateDto should be defined', () => {
    expect(new UpdateEmailTemplateDto()).toBeDefined();
  });
  it('PreviewEmailTemplateDto should be defined', () => {
    expect(new PreviewEmailTemplateDto()).toBeDefined();
  });
});
