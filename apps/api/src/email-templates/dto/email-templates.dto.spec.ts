import { describe, it, expect } from 'vitest';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, SendTemplatedDto, SendRawDto, EmailTemplateFiltersDto } from './email-templates.dto';

describe('EmailTemplates DTO', () => {
  it('CreateEmailTemplateDto should be defined', () => {
    expect(new CreateEmailTemplateDto()).toBeDefined();
  });
  it('UpdateEmailTemplateDto should be defined', () => {
    expect(new UpdateEmailTemplateDto()).toBeDefined();
  });
  it('SendTemplatedDto should be defined', () => {
    expect(new SendTemplatedDto()).toBeDefined();
  });
  it('SendRawDto should be defined', () => {
    expect(new SendRawDto()).toBeDefined();
  });
  it('EmailTemplateFiltersDto should be defined', () => {
    expect(new EmailTemplateFiltersDto()).toBeDefined();
  });
});
