import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { MetaCloudProvider } from './providers/meta-cloud.provider';
import { EvolutionProvider } from './providers/evolution.provider';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, MetaCloudProvider, EvolutionProvider],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
