import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateMcpConfigDto,
  McpConfig,
  UpdateMcpConfigDto,
} from './mcp-configs.types';

@Injectable()
export class McpConfigsService implements OnModuleInit {
  private readonly items = new Map<string, McpConfig>();

  onModuleInit(): void {
    if (this.items.size > 0) return;
    this.create({
      name: '示例 MCP',
      description: '占位',
      transportJson: '{"type":"stdio","placeholder":true}',
    });
  }

  list(): McpConfig[] {
    return [...this.items.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  get(id: string): McpConfig | undefined {
    return this.items.get(id);
  }

  create(dto: CreateMcpConfigDto): McpConfig {
    const now = new Date().toISOString();
    const row: McpConfig = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? '',
      transportJson: dto.transportJson ?? '{}',
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(row.id, row);
    return row;
  }

  update(id: string, dto: UpdateMcpConfigDto): McpConfig {
    const cur = this.items.get(id);
    if (!cur) {
      throw new NotFoundException(`MCP config ${id} not found`);
    }
    const next: McpConfig = {
      ...cur,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }

  remove(id: string): void {
    if (!this.items.has(id)) {
      throw new NotFoundException(`MCP config ${id} not found`);
    }
    this.items.delete(id);
  }
}
