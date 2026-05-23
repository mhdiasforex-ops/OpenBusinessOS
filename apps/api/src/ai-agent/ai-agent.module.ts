import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [AiAgentController],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
