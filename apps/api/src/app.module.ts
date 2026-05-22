import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './common/tenant.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { FinancialModule } from './financial/financial.module';
import { CrmModule } from './crm/crm.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ProductsModule } from './products/products.module';
import { EventsModule } from './events/events.module';
import { JwtGuard } from './auth/jwt.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),

    // Throttle
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Events
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),

    // Logger
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),

    // Core
    PrismaModule,
    TenantModule,

    // Features
    AuthModule,
    OrganizationModule,
    FinancialModule,
    CrmModule,
    WorkflowModule,
    AnalyticsModule,
    OnboardingModule,
    ProductsModule,
    EventsModule,
  ],
  providers: [
    // Global guards — executed in order for every request
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
