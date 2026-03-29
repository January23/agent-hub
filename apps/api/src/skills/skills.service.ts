import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateSkillDto, Skill, UpdateSkillDto } from './skills.types';
import { SkillEntity } from './skill.entity';

@Injectable()
export class SkillsService implements OnModuleInit {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly skillRepository: Repository<SkillEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.skillRepository.count();
    if (count > 0) return;
    await this.create({
      name: '示例 Skill',
      description: '占位数据，可删除',
      definition: '在此填写技能说明或工具清单。',
    });
  }

  async list(): Promise<Skill[]> {
    return this.skillRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async get(id: string): Promise<Skill | undefined> {
    const skill = await this.skillRepository.findOneBy({ id });
    return skill ?? undefined;
  }

  async create(dto: CreateSkillDto): Promise<Skill> {
    const skill = this.skillRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      definition: dto.definition ?? '',
    });
    return this.skillRepository.save(skill);
  }

  async update(id: string, dto: UpdateSkillDto): Promise<Skill> {
    const cur = await this.get(id);
    if (!cur) {
      throw new NotFoundException(`Skill ${id} not found`);
    }

    Object.assign(cur, {
      name: dto.name ?? cur.name,
      description: dto.description ?? cur.description,
      definition: dto.definition ?? cur.definition,
    });

    return this.skillRepository.save(cur);
  }

  async remove(id: string): Promise<void> {
    const result = await this.skillRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Skill ${id} not found`);
    }
  }
}
