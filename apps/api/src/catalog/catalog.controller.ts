import { Controller, Get } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import { KnowledgeBasesService } from '../knowledge-bases/knowledge-bases.service';
import { McpConfigsService } from '../mcp-configs/mcp-configs.service';
import { SkillsService } from '../skills/skills.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly skills: SkillsService,
    private readonly mcp: McpConfigsService,
    private readonly kb: KnowledgeBasesService,
    private readonly agents: AgentsService,
  ) {}

  /** 前端「Agent 配置」页一次拉齐下拉选项 */
  @Get('agent-editor')
  async agentEditor() {
    const [skills, mcpConfigs, knowledgeBases, agents] = await Promise.all([
      this.skills.list(),
      this.mcp.list(),
      this.kb.list(),
      this.agents.list(),
    ]);

    return {
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      })),
      mcpConfigs: mcpConfigs.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
      })),
      knowledgeBases: knowledgeBases.map((k) => ({
        id: k.id,
        name: k.name,
        description: k.description,
      })),
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        published: a.published,
      })),
    };
  }
}
