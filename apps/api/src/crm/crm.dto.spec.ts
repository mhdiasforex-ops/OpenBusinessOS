import { describe, it, expect } from 'vitest';
import { CreateCustomerDto, UpdateCustomerDto, CreateCampaignDto } from './crm.dto';

describe('CRM DTOs', () => {
  it('CreateCustomerDto should be defined', () => {
    expect(new CreateCustomerDto()).toBeDefined();
  });
  it('UpdateCustomerDto should be defined', () => {
    expect(new UpdateCustomerDto()).toBeDefined();
  });
  it('CreateCampaignDto should be defined', () => {
    expect(new CreateCampaignDto()).toBeDefined();
  });
});
