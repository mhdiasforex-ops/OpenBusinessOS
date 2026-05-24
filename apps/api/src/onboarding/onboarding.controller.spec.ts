import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingController } from './onboarding.controller';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let onboardingService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    onboardingService = {
      getConfig: vi.fn().mockResolvedValue({ steps: [] }),
      startOnboarding: vi.fn().mockResolvedValue({ id: 'onb-1' }),
      completeStep: vi.fn().mockResolvedValue({ step: 'profile', completed: true }),
      completeOnboarding: vi.fn().mockResolvedValue({ completed: true }),
    };
    controller = new OnboardingController(onboardingService);
  });

  it('should call getConfig with niche', async () => {
    const result = await controller.getConfig('restaurant');
    expect(onboardingService.getConfig).toHaveBeenCalledWith('restaurant');
    expect(result).toEqual({ steps: [] });
  });

  it('should call startOnboarding with organizationId and niche', async () => {
    const result = await controller.startOnboarding(req, 'restaurant');
    expect(onboardingService.startOnboarding).toHaveBeenCalledWith('org-123', 'restaurant');
    expect(result).toEqual({ id: 'onb-1' });
  });

  it('should call completeStep with organizationId, stepId, and data', async () => {
    const body = { stepId: 'profile', data: { name: 'My Business' } };
    const result = await controller.completeStep(req, body);
    expect(onboardingService.completeStep).toHaveBeenCalledWith('org-123', 'profile', { name: 'My Business' });
    expect(result).toEqual({ step: 'profile', completed: true });
  });

  it('should call completeOnboarding with organizationId', async () => {
    const result = await controller.completeOnboarding(req);
    expect(onboardingService.completeOnboarding).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ completed: true });
  });
});
