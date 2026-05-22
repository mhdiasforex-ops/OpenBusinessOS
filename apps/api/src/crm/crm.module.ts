import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { LtvService } from './ltv.service';
import { SegmentationService } from './segmentation.service';
import { ChurnDetectorService } from './churn-detector.service';
import { CampaignsController } from './campaigns.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [CrmController, CampaignsController],
  providers: [CrmService, LtvService, SegmentationService, ChurnDetectorService],
  exports: [CrmService, LtvService, SegmentationService, ChurnDetectorService],
})
export class CrmModule {}
