import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { CashFlowService } from './cash-flow.service';
import { ConciliationService } from './conciliation.service';
import { OverdueDetector } from './overdue-detector';
import { DreService } from './dre.service';
import { CmvService } from './cmv.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FinancialController],
  providers: [
    FinancialService,
    CashFlowService,
    ConciliationService,
    OverdueDetector,
    DreService,
    CmvService,
  ],
  exports: [FinancialService, CashFlowService, ConciliationService, OverdueDetector, DreService, CmvService],
})
export class FinancialModule {}
