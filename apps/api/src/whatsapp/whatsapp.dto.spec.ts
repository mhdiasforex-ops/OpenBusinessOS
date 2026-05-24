import { describe, it, expect } from 'vitest';
import { CreateWhatsAppConfigDto, UpdateWhatsAppConfigDto, CreateWhatsAppTemplateDto, UpdateWhatsAppTemplateDto, SendMessageDto, MessageFiltersDto, TemplateFiltersDto, ConfigFiltersDto } from './whatsapp.dto';

describe('WhatsApp DTOs (root)', () => {
  it('CreateWhatsAppConfigDto should be defined', () => {
    expect(new CreateWhatsAppConfigDto()).toBeDefined();
  });
  it('UpdateWhatsAppConfigDto should be defined', () => {
    expect(new UpdateWhatsAppConfigDto()).toBeDefined();
  });
  it('CreateWhatsAppTemplateDto should be defined', () => {
    expect(new CreateWhatsAppTemplateDto()).toBeDefined();
  });
  it('UpdateWhatsAppTemplateDto should be defined', () => {
    expect(new UpdateWhatsAppTemplateDto()).toBeDefined();
  });
  it('SendMessageDto should be defined', () => {
    expect(new SendMessageDto()).toBeDefined();
  });
  it('MessageFiltersDto should be defined', () => {
    expect(new MessageFiltersDto()).toBeDefined();
  });
  it('TemplateFiltersDto should be defined', () => {
    expect(new TemplateFiltersDto()).toBeDefined();
  });
  it('ConfigFiltersDto should be defined', () => {
    expect(new ConfigFiltersDto()).toBeDefined();
  });
});
