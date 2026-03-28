import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { McpConfigsService } from './mcp-configs.service';
import type {
  CreateMcpConfigDto,
  UpdateMcpConfigDto,
} from './mcp-configs.types';

@Controller('mcp-configs')
export class McpConfigsController {
  constructor(private readonly mcp: McpConfigsService) {}

  @Get()
  list() {
    return this.mcp.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const item = this.mcp.get(id);
    if (!item) {
      throw new NotFoundException(`MCP config ${id} not found`);
    }
    return item;
  }

  @Post()
  create(@Body() body: CreateMcpConfigDto) {
    return this.mcp.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateMcpConfigDto) {
    return this.mcp.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.mcp.remove(id);
    return { ok: true as const };
  }
}
