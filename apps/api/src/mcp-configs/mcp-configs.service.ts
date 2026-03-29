import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateMcpConfigDto,
  McpConfig,
  UpdateMcpConfigDto,
} from './mcp-configs.types';
import { McpConfigEntity } from './mcp-config.entity';

@Injectable()
export class McpConfigsService implements OnModuleInit {
  constructor(
    @InjectRepository(McpConfigEntity)
    private readonly mcpConfigRepository: Repository<McpConfigEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.mcpConfigRepository.count();
    if (count > 0) return;
    await this.create({
      name: '示例 MCP',
      description: '占位',
      transportJson: '{"type":"stdio","placeholder":true}',
    });
  }

  async list(): Promise<McpConfig[]> {
    return this.mcpConfigRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async get(id: string): Promise<McpConfig | undefined> {
    const config = await this.mcpConfigRepository.findOneBy({ id });
    return config ?? undefined;
  }

  async create(dto: CreateMcpConfigDto): Promise<McpConfig> {
    const mcpConfig = this.mcpConfigRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      transportJson: dto.transportJson ?? '{}',
    });
    return this.mcpConfigRepository.save(mcpConfig);
  }

  async update(id: string, dto: UpdateMcpConfigDto): Promise<McpConfig> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`MCP config ${id} not found`);
    }

    Object.assign(cur, {
      name: dto.name ?? cur.name,
      description: dto.description ?? cur.description,
      transportJson: dto.transportJson ?? cur.transportJson,
    });

    return this.mcpConfigRepository.save(cur);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mcpConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MCP config ${id} not found`);
    }
  }
}
