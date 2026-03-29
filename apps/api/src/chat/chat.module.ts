import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { SkillsModule } from '../skills/skills.module';
import { McpConfigsModule } from '../mcp-configs/mcp-configs.module';
import { KnowledgeBasesModule } from '../knowledge-bases/knowledge-bases.module';
import { McpModule } from '../mcp/mcp.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    AgentsModule,
    SkillsModule,
    McpConfigsModule,
    KnowledgeBasesModule,
    McpModule,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
