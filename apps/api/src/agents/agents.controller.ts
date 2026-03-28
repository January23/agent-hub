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
import {
  RequestIdentity,
  type RequestIdentityPayload,
} from '../auth/request-identity.decorator';
import { AgentsService } from './agents.service';
import type { CreateAgentDto, UpdateAgentDto } from './agents.types';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  async list() {
    return this.agents.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const item = await this.agents.get(id);
    if (!item) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return item;
  }

  @Post()
  async create(
    @Body() body: CreateAgentDto,
    @RequestIdentity() identity: RequestIdentityPayload,
  ) {
    return this.agents.create(body, identity.subject);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAgentDto) {
    return this.agents.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.agents.remove(id);
    return { ok: true as const };
  }

  /** 发布后，市场可检索；TODO：非 owner 访问需申请权限 */
  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.agents.publish(id);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return this.agents.unpublish(id);
  }
}
