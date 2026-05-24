import { describe, it, expect } from 'vitest';
import { CompleteOnboardingDto } from './onboarding.dto';

describe('CompleteOnboardingDto', () => {
  it('should be defined', () => {
    expect(new CompleteOnboardingDto()).toBeDefined();
  });
});
