import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { OmnichannelService } from './omnichannel.service';
import { OmnichannelController } from './omnichannel.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [OmnichannelController],
  providers: [OmnichannelService],
  exports: [OmnichannelService],
})
export class OmnichannelModule {}
