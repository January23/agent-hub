import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateSkillDto, Skill, UpdateSkillDto } from './skills.types';

@Injectable()
export class SkillsService implements OnModuleInit {
  private readonly items = new Map<string, Skill>();

  onModuleInit(): void {
    if (this.items.size > 0) return;
    this.create({
      name: '示例 Skill',
      description: '占位数据，可删除',
      definition: '在此填写技能说明或工具清单。',
    });
  }

  list(): Skill[] {
    return [...this.items.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  get(id: string): Skill | undefined {
    return this.items.get(id);
  }

  create(dto: CreateSkillDto): Skill {
    const now = new Date().toISOString();
    const skill: Skill = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? '',
      definition: dto.definition ?? '',
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(skill.id, skill);
    return skill;
  }

  update(id: string, dto: UpdateSkillDto): Skill {
    const cur = this.items.get(id);
    if (!cur) {
      throw new NotFoundException(`Skill ${id} not found`);
    }
    const next: Skill = {
      ...cur,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, next);
    return next;
  }

  remove(id: string): void {
    if (!this.items.has(id)) {
      throw new NotFoundException(`Skill ${id} not found`);
    }
    this.items.delete(id);
  }
}
