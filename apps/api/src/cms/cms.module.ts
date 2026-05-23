import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
