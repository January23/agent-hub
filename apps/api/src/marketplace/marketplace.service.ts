import { Injectable } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import type { RequestIdentityPayload } from '../auth/request-identity.decorator';
import type { MarketplaceAgentSummary } from './marketplace.types';

@Injectable()
export class MarketplaceService {
  constructor(private readonly agents: AgentsService) {}

  async search(
    query: string | undefined,
    viewer: RequestIdentityPayload,
  ): Promise<MarketplaceAgentSummary[]> {
    const q = query?.trim().toLowerCase() ?? '';
    const agents = await this.agents.list();
    
    return agents
      .filter((a) => a.published)
      .filter(
        (a) =>
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.prompt.toLowerCase().includes(q),
      )
      .map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        published: a.published,
        publishedAt: a.publishedAt,
        ownerSubject: a.ownerSubject,
        access:
          viewer.subject != null && viewer.subject === a.ownerSubject
            ? 'owner'
            : ('public_stub' as const),
      }));
  }
}
