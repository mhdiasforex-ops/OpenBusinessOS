import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FiscalController],
  providers: [FiscalService],
  exports: [FiscalService],
})
export class FiscalModule {}
