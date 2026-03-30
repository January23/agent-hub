import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { SkillsModule } from '../skills/skills.module';
import { McpConfigsModule } from '../mcp-configs/mcp-configs.module';
import { KnowledgeBasesModule } from '../knowledge-bases/knowledge-bases.module';
import { McpModule } from '../mcp/mcp.module';
import { ModelConfigsModule } from '../model-configs/model-configs.module';
import { ChatController } from './chat.controller';
import { ChatSessionService } from './chat-session.service';

@Module({
  imports: [AgentsModule, SkillsModule, McpConfigsModule, KnowledgeBasesModule, McpModule, ModelConfigsModule],
  controllers: [ChatController],
  providers: [ChatSessionService],
})
export class ChatModule {}
