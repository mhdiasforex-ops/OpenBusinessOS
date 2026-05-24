import { describe, it, expect } from 'vitest';
import { OnboardingModule } from './onboarding.module';

describe('OnboardingModule', () => {
  it('should be defined', () => {
    expect(new OnboardingModule()).toBeDefined();
  });
});
