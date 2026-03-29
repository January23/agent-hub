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
import { ModelConfigsService } from './model-configs.service';
import type { CreateModelConfigDto, UpdateModelConfigDto } from './model-configs.types';

@Controller('model-configs')
export class ModelConfigsController {
  constructor(private readonly modelConfigs: ModelConfigsService) {}

  @Get()
  list() {
    return this.modelConfigs.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const item = this.modelConfigs.get(id);
    if (!item) {
      throw new NotFoundException(`大模型配置 ${id} 不存在`);
    }
    return item;
  }

  @Post()
  create(@Body() body: CreateModelConfigDto) {
    return this.modelConfigs.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateModelConfigDto) {
    return this.modelConfigs.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.modelConfigs.remove(id);
    return { ok: true as const };
  }
}
