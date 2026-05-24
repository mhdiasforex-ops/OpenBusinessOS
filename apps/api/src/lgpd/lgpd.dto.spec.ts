import { describe, it, expect } from 'vitest';
import { RegisterConsentDto, UpdateConsentDto, DataAccessDto, ExportDataDto, DeleteDataDto, AnonymizeDto, ContactDpoDto, UpdatePolicyDto } from './lgpd.dto';

describe('LGPD DTOs', () => {
  it('RegisterConsentDto should be defined', () => {
    expect(new RegisterConsentDto()).toBeDefined();
  });
  it('UpdateConsentDto should be defined', () => {
    expect(new UpdateConsentDto()).toBeDefined();
  });
  it('DataAccessDto should be defined', () => {
    expect(new DataAccessDto()).toBeDefined();
  });
  it('ExportDataDto should be defined', () => {
    expect(new ExportDataDto()).toBeDefined();
  });
  it('DeleteDataDto should be defined', () => {
    expect(new DeleteDataDto()).toBeDefined();
  });
  it('AnonymizeDto should be defined', () => {
    expect(new AnonymizeDto()).toBeDefined();
  });
  it('ContactDpoDto should be defined', () => {
    expect(new ContactDpoDto()).toBeDefined();
  });
  it('UpdatePolicyDto should be defined', () => {
    expect(new UpdatePolicyDto()).toBeDefined();
  });
});
