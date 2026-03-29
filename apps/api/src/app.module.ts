import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { ModelConfigsModule } from './model-configs/model-configs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'agent_hub'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 开发环境自动同步表结构，生产环境请关闭
      }),
      inject: [ConfigService],
    }),
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
