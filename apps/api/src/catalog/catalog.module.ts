import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { KnowledgeBasesModule } from '../knowledge-bases/knowledge-bases.module';
import { McpConfigsModule } from '../mcp-configs/mcp-configs.module';
import { SkillsModule } from '../skills/skills.module';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [SkillsModule, McpConfigsModule, KnowledgeBasesModule, AgentsModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
