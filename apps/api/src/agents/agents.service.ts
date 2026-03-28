import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './agent.entity';
import type { CreateAgentDto, UpdateAgentDto } from './agents.types';

const defaultModel = (): Agent['model'] => ({
  provider: 'openai-compatible',
  model: 'gpt-4o-mini',
  temperature: 0.2,
});

@Injectable()
export class AgentsService implements OnModuleInit {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.agentRepository.count();
    if (count > 0) return;

    const now = new Date().toISOString();
    const agent = this.agentRepository.create({
      name: '示例 Agent（已上架）',
      description: '演示用，已发布到市场；可删除或修改。',
      prompt: '你是企业内部助手，回答简洁、可执行。',
      skillIds: [],
      mcpConfigIds: [],
      knowledgeBaseIds: [],
      linkedAgentIds: [],
      model: defaultModel(),
      published: true,
      publishedAt: now,
      ownerSubject: null,
    });
    await this.agentRepository.save(agent);
  }

  async list(): Promise<Agent[]> {
    return this.agentRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async get(id: string): Promise<Agent | null> {
    return this.agentRepository.findOneBy({ id });
  }

  async create(
    dto: CreateAgentDto,
    ownerSubject: string | null,
  ): Promise<Agent> {
    const agent = this.agentRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      prompt: dto.prompt ?? '',
      skillIds: dto.skillIds ?? [],
      mcpConfigIds: dto.mcpConfigIds ?? [],
      knowledgeBaseIds: dto.knowledgeBaseIds ?? [],
      linkedAgentIds: dto.linkedAgentIds ?? [],
      model: { ...defaultModel(), ...dto.model },
      published: false,
      publishedAt: null,
      ownerSubject,
    });
    return this.agentRepository.save(agent);
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    Object.assign(cur, {
      name: dto.name ?? cur.name,
      description: dto.description ?? cur.description,
      prompt: dto.prompt ?? cur.prompt,
      skillIds: dto.skillIds ?? cur.skillIds,
      mcpConfigIds: dto.mcpConfigIds ?? cur.mcpConfigIds,
      knowledgeBaseIds: dto.knowledgeBaseIds ?? cur.knowledgeBaseIds,
      linkedAgentIds: dto.linkedAgentIds ?? cur.linkedAgentIds,
      model: dto.model ? { ...cur.model, ...dto.model } : cur.model,
    });

    return this.agentRepository.save(cur);
  }

  async remove(id: string): Promise<void> {
    const result = await this.agentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
  }

  async publish(id: string): Promise<Agent> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    cur.published = true;
    if (!cur.publishedAt) {
      cur.publishedAt = new Date().toISOString();
    }

    return this.agentRepository.save(cur);
  }

  async unpublish(id: string): Promise<Agent> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    cur.published = false;
    cur.publishedAt = null;

    return this.agentRepository.save(cur);
  }
}
