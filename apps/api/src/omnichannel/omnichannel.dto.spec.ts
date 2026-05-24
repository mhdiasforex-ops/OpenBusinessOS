import { describe, it, expect } from 'vitest';
import { SendWhatsAppDto, SendEmailDto, SendSmsDto, ReplyConversationDto, CreateTemplateDto } from './omnichannel.dto';

describe('Omnichannel DTOs', () => {
  it('SendWhatsAppDto should be defined', () => {
    expect(new SendWhatsAppDto()).toBeDefined();
  });
  it('SendEmailDto should be defined', () => {
    expect(new SendEmailDto()).toBeDefined();
  });
  it('SendSmsDto should be defined', () => {
    expect(new SendSmsDto()).toBeDefined();
  });
  it('ReplyConversationDto should be defined', () => {
    expect(new ReplyConversationDto()).toBeDefined();
  });
  it('CreateTemplateDto should be defined', () => {
    expect(new CreateTemplateDto()).toBeDefined();
  });
});
