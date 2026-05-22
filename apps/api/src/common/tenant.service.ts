import { Injectable } from '@nestjs/common';
import { tenantContext } from './tenant.middleware';

@Injectable()
export class TenantService {
  getOrganizationId(): string | undefined {
    const ctx = tenantContext.getStore();
    return ctx?.organizationId;
  }

  requireOrganizationId(): string {
    const orgId = this.getOrganizationId();
    if (!orgId) {
      throw new Error('Organization context not found. Ensure TenantMiddleware is applied.');
    }
    return orgId;
  }
}
