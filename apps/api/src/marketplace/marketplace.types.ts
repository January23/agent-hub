import type { Agent } from '../agents/agents.types';

export type MarketplaceAgentSummary = Pick<
  Agent,
  'id' | 'name' | 'description' | 'published' | 'publishedAt' | 'ownerSubject'
> & {
  /** TODO: granted | pending | denied — 对接权限申请后填充 */
  access: 'public_stub' | 'owner';
};
