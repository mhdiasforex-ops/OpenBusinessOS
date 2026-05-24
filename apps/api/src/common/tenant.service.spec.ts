import { TenantService } from './tenant.service';
import { tenantContext } from './tenant.middleware';

vi.mock('./tenant.middleware', () => ({
  tenantContext: {
    getStore: vi.fn(),
  },
}));

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    service = new TenantService();
    vi.clearAllMocks();
  });

  describe('getOrganizationId', () => {
    it('returns organizationId when store exists', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue({ organizationId: 'org-123' });
      expect(service.getOrganizationId()).toBe('org-123');
    });

    it('returns undefined when store is undefined', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue(undefined);
      expect(service.getOrganizationId()).toBeUndefined();
    });

    it('returns undefined when store is null', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue(null);
      expect(service.getOrganizationId()).toBeUndefined();
    });

    it('returns undefined when store has no organizationId', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue({});
      expect(service.getOrganizationId()).toBeUndefined();
    });
  });

  describe('requireOrganizationId', () => {
    it('returns organizationId when store exists', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue({ organizationId: 'org-456' });
      expect(service.requireOrganizationId()).toBe('org-456');
    });

    it('throws when store is undefined', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue(undefined);
      expect(() => service.requireOrganizationId()).toThrow(
        'Organization context not found. Ensure TenantMiddleware is applied.',
      );
    });

    it('throws when store is null', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue(null);
      expect(() => service.requireOrganizationId()).toThrow(
        'Organization context not found. Ensure TenantMiddleware is applied.',
      );
    });

    it('throws when store has no organizationId', () => {
      (tenantContext.getStore as vi.Mock).mockReturnValue({});
      expect(() => service.requireOrganizationId()).toThrow(
        'Organization context not found. Ensure TenantMiddleware is applied.',
      );
    });
  });
});
