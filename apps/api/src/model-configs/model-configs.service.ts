import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateModelConfigDto, ModelConfig, UpdateModelConfigDto } from './model-configs.types';
import { ModelConfigEntity } from './model-config.entity';

@Injectable()
export class ModelConfigsService implements OnModuleInit {
  constructor(
    @InjectRepository(ModelConfigEntity)
    private readonly modelConfigRepository: Repository<ModelConfigEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.modelConfigRepository.count();
    if (count > 0) return;
    // 初始化一个示例配置
    await this.create({
      name: '示例大模型',
      provider: 'openai-compatible',
      model: 'gpt-4o-mini',
      temperature: 0.2,
      apiKey: 'sk-xxx',
      baseUrl: 'https://api.openai.com/v1',
      description: 'OpenAI GPT-4o Mini 示例配置',
    });
  }

  async list(): Promise<ModelConfig[]> {
    return this.modelConfigRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async get(id: string): Promise<ModelConfig | undefined> {
    const config = await this.modelConfigRepository.findOneBy({ id });
    return config ?? undefined;
  }

  async create(dto: CreateModelConfigDto): Promise<ModelConfig> {
    const modelConfig = this.modelConfigRepository.create({
      name: dto.name,
      provider: dto.provider,
      model: dto.model,
      temperature: dto.temperature ?? 0.2,
      apiKey: dto.apiKey,
      baseUrl: dto.baseUrl,
      description: dto.description ?? '',
    });
    return this.modelConfigRepository.save(modelConfig);
  }

  async update(id: string, dto: UpdateModelConfigDto): Promise<ModelConfig> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`大模型配置 ${id} 不存在`);
    }

    Object.assign(cur, {
      name: dto.name ?? cur.name,
      provider: dto.provider ?? cur.provider,
      model: dto.model ?? cur.model,
      temperature: dto.temperature ?? cur.temperature,
      apiKey: dto.apiKey ?? cur.apiKey,
      baseUrl: dto.baseUrl ?? cur.baseUrl,
      description: dto.description ?? cur.description,
    });

    return this.modelConfigRepository.save(cur);
  }

  async remove(id: string): Promise<void> {
    const result = await this.modelConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`大模型配置 ${id} 不存在`);
    }
  }
}
