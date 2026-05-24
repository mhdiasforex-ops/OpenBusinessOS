import { describe, it, expect } from 'vitest';
import { CreateCmsPageDto, UpdateCmsPageDto, CreateCmsBlockDto, UpdateCmsBlockDto, CreateCmsMediaDto } from './cms.dto';

describe('CMS DTOs', () => {
  it('CreateCmsPageDto should be defined', () => {
    expect(new CreateCmsPageDto()).toBeDefined();
  });
  it('UpdateCmsPageDto should be defined', () => {
    expect(new UpdateCmsPageDto()).toBeDefined();
  });
  it('CreateCmsBlockDto should be defined', () => {
    expect(new CreateCmsBlockDto()).toBeDefined();
  });
  it('UpdateCmsBlockDto should be defined', () => {
    expect(new UpdateCmsBlockDto()).toBeDefined();
  });
  it('CreateCmsMediaDto should be defined', () => {
    expect(new CreateCmsMediaDto()).toBeDefined();
  });
});
