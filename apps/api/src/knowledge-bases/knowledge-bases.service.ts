import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateKnowledgeBaseDto,
  KnowledgeBase,
  UpdateKnowledgeBaseDto,
} from './knowledge-bases.types';

@Injectable()
export class KnowledgeBasesService implements OnModuleInit {
  private readonly items = new Map<string, KnowledgeBase>();

  onModuleInit(): void {
    if (this.items.size > 0) return;
    this.create({
      name: '示例知识库',
      description: '占位',
      storageHint: 's3://bucket/prefix 或 pgvector 集合名',
    });
  }

  list(): KnowledgeBase[] {
    return [...this.items.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  get(id: string): KnowledgeBase | undefined {
    return this.items.get(id);
  }

  create(dto: CreateKnowledgeBaseDto): KnowledgeBase {
    const now = new Date().toISOString();
    const row: KnowledgeBase = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? '',
      storageHint: dto.storageHint ?? '',
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(row.id, row);
    return row;
  }

  update(id: string, dto: UpdateKnowledgeBaseDto): KnowledgeBase {
    const cur = this.items.get(id);
    if (!cur) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }
    const next: KnowledgeBase = {
      ...cur,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }

  remove(id: string): void {
    if (!this.items.has(id)) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }
    this.items.delete(id);
  }
}
