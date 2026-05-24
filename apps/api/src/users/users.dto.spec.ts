import { describe, it, expect } from 'vitest';
import { UpdateProfileDto, UpdateUserRoleDto, UserFiltersDto } from './users.dto';

describe('Users DTOs', () => {
  it('UpdateProfileDto should be defined', () => {
    expect(new UpdateProfileDto()).toBeDefined();
  });
  it('UpdateUserRoleDto should be defined', () => {
    expect(new UpdateUserRoleDto()).toBeDefined();
  });
  it('UserFiltersDto should be defined', () => {
    expect(new UserFiltersDto()).toBeDefined();
  });
});
