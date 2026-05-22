import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { ConfigGeneratorService } from './config-generator.service';

@Module({
 imports: [PrismaModule, EventsModule],
 controllers: [OnboardingController],
 providers: [OnboardingService, ConfigGeneratorService],
 exports: [OnboardingService, ConfigGeneratorService],
})
export class OnboardingModule {}
