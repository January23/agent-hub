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
  list() {
    return this.agents.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const item = this.agents.get(id);
    if (!item) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return item;
  }

  @Post()
  create(
    @Body() body: CreateAgentDto,
    @RequestIdentity() identity: RequestIdentityPayload,
  ) {
    return this.agents.create(body, identity.subject);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAgentDto) {
    return this.agents.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.agents.remove(id);
    return { ok: true as const };
  }

  /** 发布后，市场可检索；TODO：非 owner 访问需申请权限 */
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.agents.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.agents.unpublish(id);
  }
}
