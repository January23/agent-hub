import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [AgentsModule],
  controllers: [ChatController],
})
export class ChatModule {}
