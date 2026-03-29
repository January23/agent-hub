import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateKnowledgeBaseDto,
  KnowledgeBase,
  UpdateKnowledgeBaseDto,
} from './knowledge-bases.types';
import { KnowledgeBaseEntity } from './knowledge-base.entity';

@Injectable()
export class KnowledgeBasesService implements OnModuleInit {
  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private readonly knowledgeBaseRepository: Repository<KnowledgeBaseEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.knowledgeBaseRepository.count();
    if (count > 0) return;
    await this.create({
      name: '示例知识库',
      description: '占位',
      storageHint: 's3://bucket/prefix 或 pgvector 集合名',
    });
  }

  async list(): Promise<KnowledgeBase[]> {
    return this.knowledgeBaseRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async get(id: string): Promise<KnowledgeBase | undefined> {
    const kb = await this.knowledgeBaseRepository.findOneBy({ id });
    return kb ?? undefined;
  }

  async create(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const kb = this.knowledgeBaseRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      storageHint: dto.storageHint ?? '',
    });
    return this.knowledgeBaseRepository.save(kb);
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }

    Object.assign(cur, {
      name: dto.name ?? cur.name,
      description: dto.description ?? cur.description,
      storageHint: dto.storageHint ?? cur.storageHint,
    });

    return this.knowledgeBaseRepository.save(cur);
  }

  async remove(id: string): Promise<void> {
    const result = await this.knowledgeBaseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }
  }
}
