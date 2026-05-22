import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage<{ organizationId: string }>();

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const orgId = req.user?.organizationId || req.headers['x-organization-id'] as string;

    if (orgId) {
      tenantContext.run({ organizationId: orgId }, () => next());
    } else {
      next();
    }
  }
}
