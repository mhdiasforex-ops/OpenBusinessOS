import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RhService } from './rh.service';
import { RhController } from './rh.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RhController],
  providers: [RhService],
  exports: [RhService],
})
export class RhModule {}
