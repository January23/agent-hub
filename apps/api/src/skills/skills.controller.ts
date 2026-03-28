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
import { SkillsService } from './skills.service';
import type { CreateSkillDto, UpdateSkillDto } from './skills.types';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  list() {
    return this.skills.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const item = this.skills.get(id);
    if (!item) {
      throw new NotFoundException(`Skill ${id} not found`);
    }
    return item;
  }

  @Post()
  create(@Body() body: CreateSkillDto) {
    return this.skills.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSkillDto) {
    return this.skills.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.skills.remove(id);
    return { ok: true as const };
  }
}
