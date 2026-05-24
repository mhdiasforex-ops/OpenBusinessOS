import { describe, it, expect } from 'vitest';
import { SendMessageDto, CreateTemplateDto, WebhookDto } from './whatsapp.dto';

describe('WhatsApp DTO (dto)', () => {
  it('SendMessageDto should be defined', () => {
    expect(new SendMessageDto()).toBeDefined();
  });
  it('CreateTemplateDto should be defined', () => {
    expect(new CreateTemplateDto()).toBeDefined();
  });
  it('WebhookDto should be defined', () => {
    expect(new WebhookDto()).toBeDefined();
  });
});
