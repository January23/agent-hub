export type ModelConfig = {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  apiKey: string;
  baseUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateModelConfigDto = {
  name: string;
  provider: string;
  model: string;
  temperature?: number;
  apiKey: string;
  baseUrl: string;
  description?: string;
};

export type UpdateModelConfigDto = Partial<CreateModelConfigDto>;
