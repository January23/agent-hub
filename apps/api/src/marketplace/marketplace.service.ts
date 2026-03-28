import { Injectable } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import type { RequestIdentityPayload } from '../auth/request-identity.decorator';
import type { MarketplaceAgentSummary } from './marketplace.types';

@Injectable()
export class MarketplaceService {
  constructor(private readonly agents: AgentsService) {}

  search(
    query: string | undefined,
    viewer: RequestIdentityPayload,
  ): MarketplaceAgentSummary[] {
    const q = query?.trim().toLowerCase() ?? '';
    return this.agents
      .list()
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
