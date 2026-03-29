import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpConfigsController } from './mcp-configs.controller';
import { McpConfigsService } from './mcp-configs.service';
import { McpConfigEntity } from './mcp-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([McpConfigEntity])],
  controllers: [McpConfigsController],
  providers: [McpConfigsService],
  exports: [McpConfigsService],
})
export class McpConfigsModule {}
