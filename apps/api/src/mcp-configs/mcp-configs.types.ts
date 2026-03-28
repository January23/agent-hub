export type McpConfig = {
  id: string;
  name: string;
  description: string;
  /** 占位：JSON 配置或接入说明，后续对接真实 MCP transport */
  transportJson: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMcpConfigDto = {
  name: string;
  description?: string;
  transportJson?: string;
};

export type UpdateMcpConfigDto = Partial<CreateMcpConfigDto>;
