import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { MetricsService } from './metrics.service';
import { CrossModuleService } from './cross-module.service';
import { AnomalyDetectorService } from './anomaly-detector.service';
import { DashboardController } from './dashboard.controller';

@Module({
 imports: [PrismaModule, EventsModule],
  controllers: [AnalyticsController, DashboardController],
  providers: [AnalyticsService, MetricsService, CrossModuleService, AnomalyDetectorService],
  exports: [AnalyticsService, MetricsService, CrossModuleService, AnomalyDetectorService],
})
export class AnalyticsModule {}
