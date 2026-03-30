export type AgentEditorCatalog = {
  skills: { id: string; name: string; description: string }[];
  mcpConfigs: { id: string; name: string; description: string }[];
  knowledgeBases: { id: string; name: string; description: string }[];
  agents: { id: string; name: string; published: boolean }[];
  modelConfigs: { id: string; name: string; description: string }[];
};

export type AgentDTO = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  skillIds: string[];
  mcpConfigIds: string[];
  knowledgeBaseIds: string[];
  linkedAgentIds: string[];
  modelId: string;
  published: boolean;
  publishedAt: string | null;
  ownerSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSession = {
  id: string;
  name: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  round: number;
};
