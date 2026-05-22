import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantMiddleware, tenantContext } from './tenant.middleware';
import { TenantService } from './tenant.service';

@Global()
@Module({
  providers: [
    TenantService,
    { provide: 'TENANT_CONTEXT', useValue: tenantContext },
  ],
  exports: [TenantService, 'TENANT_CONTEXT'],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
