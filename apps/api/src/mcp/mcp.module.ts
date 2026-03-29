import { Module } from '@nestjs/common';
import { McpExecutorService } from './mcp-executor.service';

@Module({
  providers: [McpExecutorService],
  exports: [McpExecutorService],
})
export class McpModule {}
