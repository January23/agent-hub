import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Agent, CreateAgentDto, UpdateAgentDto } from './agents.types';

const defaultModel = (): Agent['model'] => ({
  provider: 'openai-compatible',
  model: 'gpt-4o-mini',
  temperature: 0.2,
});

@Injectable()
export class AgentsService implements OnModuleInit {
  private readonly items = new Map<string, Agent>();

  onModuleInit(): void {
    if (this.items.size > 0) return;
    const now = new Date().toISOString();
    const id = randomUUID();
    const agent: Agent = {
      id,
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
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(id, agent);
  }

  list(): Agent[] {
    return [...this.items.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  get(id: string): Agent | undefined {
    return this.items.get(id);
  }

  create(dto: CreateAgentDto, ownerSubject: string | null): Agent {
    const now = new Date().toISOString();
    const agent: Agent = {
      id: randomUUID(),
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
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(agent.id, agent);
    return agent;
  }

  update(id: string, dto: UpdateAgentDto): Agent {
    const cur = this.items.get(id);
    if (!cur) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    const next: Agent = {
      ...cur,
      name: dto.name ?? cur.name,
      description: dto.description ?? cur.description,
      prompt: dto.prompt ?? cur.prompt,
      skillIds: dto.skillIds ?? cur.skillIds,
      mcpConfigIds: dto.mcpConfigIds ?? cur.mcpConfigIds,
      knowledgeBaseIds: dto.knowledgeBaseIds ?? cur.knowledgeBaseIds,
      linkedAgentIds: dto.linkedAgentIds ?? cur.linkedAgentIds,
      model: dto.model ? { ...cur.model, ...dto.model } : cur.model,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }

  remove(id: string): void {
    if (!this.items.has(id)) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    this.items.delete(id);
  }

  publish(id: string): Agent {
    const cur = this.items.get(id);
    if (!cur) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    const now = new Date().toISOString();
    const next: Agent = {
      ...cur,
      published: true,
      publishedAt: cur.publishedAt ?? now,
      updatedAt: now,
    };
    this.items.set(id, next);
    return next;
  }

  unpublish(id: string): Agent {
    const cur = this.items.get(id);
    if (!cur) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    const next: Agent = {
      ...cur,
      published: false,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }
}
