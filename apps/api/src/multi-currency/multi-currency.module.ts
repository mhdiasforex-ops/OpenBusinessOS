import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiCurrencyService } from './multi-currency.service';
import { MultiCurrencyController } from './multi-currency.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MultiCurrencyController],
  providers: [MultiCurrencyService],
  exports: [MultiCurrencyService],
})
export class MultiCurrencyModule {}
