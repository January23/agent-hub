import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeBasesModule } from './knowledge-bases/knowledge-bases.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { McpConfigsModule } from './mcp-configs/mcp-configs.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [
    AuthModule,
    SkillsModule,
    McpConfigsModule,
    KnowledgeBasesModule,
    AgentsModule,
    MarketplaceModule,
    CatalogModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
