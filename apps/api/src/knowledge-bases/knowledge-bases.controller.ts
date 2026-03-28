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
import { KnowledgeBasesService } from './knowledge-bases.service';
import type {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
} from './knowledge-bases.types';

@Controller('knowledge-bases')
export class KnowledgeBasesController {
  constructor(private readonly kb: KnowledgeBasesService) {}

  @Get()
  list() {
    return this.kb.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const item = this.kb.get(id);
    if (!item) {
      throw new NotFoundException(`Knowledge base ${id} not found`);
    }
    return item;
  }

  @Post()
  create(@Body() body: CreateKnowledgeBaseDto) {
    return this.kb.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateKnowledgeBaseDto) {
    return this.kb.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.kb.remove(id);
    return { ok: true as const };
  }
}
