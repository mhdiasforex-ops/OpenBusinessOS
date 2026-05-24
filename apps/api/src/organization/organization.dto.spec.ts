import { describe, it, expect } from 'vitest';
import { UpdateOrganizationDto, AddMemberDto } from './organization.dto';

describe('Organization DTOs', () => {
  it('UpdateOrganizationDto should be defined', () => {
    expect(new UpdateOrganizationDto()).toBeDefined();
  });
  it('AddMemberDto should be defined', () => {
    expect(new AddMemberDto()).toBeDefined();
  });
});
