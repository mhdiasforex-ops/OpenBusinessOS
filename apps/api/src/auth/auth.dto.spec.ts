import { describe, it, expect } from 'vitest';
import { RegisterDto, LoginDto, MfaVerifyDto } from './auth.dto';

describe('Auth DTOs', () => {
  it('RegisterDto should be defined', () => {
    expect(new RegisterDto()).toBeDefined();
  });
  it('LoginDto should be defined', () => {
    expect(new LoginDto()).toBeDefined();
  });
  it('MfaVerifyDto should be defined', () => {
    expect(new MfaVerifyDto()).toBeDefined();
  });
});
