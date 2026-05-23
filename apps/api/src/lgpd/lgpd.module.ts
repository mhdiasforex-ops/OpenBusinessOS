import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { LgpdService } from './lgpd.service';
import { LgpdController } from './lgpd.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [LgpdController],
  providers: [LgpdService],
  exports: [LgpdService],
})
export class LgpdModule {}
