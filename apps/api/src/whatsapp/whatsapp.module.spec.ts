import { describe, it, expect } from 'vitest';
import { WhatsAppModule } from './whatsapp.module';

describe('WhatsAppModule', () => {
  it('should be defined', () => {
    expect(new WhatsAppModule()).toBeDefined();
  });
});
