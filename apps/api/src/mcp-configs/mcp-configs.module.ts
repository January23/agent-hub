import { Module } from '@nestjs/common';
import { McpConfigsController } from './mcp-configs.controller';
import { McpConfigsService } from './mcp-configs.service';

@Module({
  controllers: [McpConfigsController],
  providers: [McpConfigsService],
  exports: [McpConfigsService],
})
export class McpConfigsModule {}
