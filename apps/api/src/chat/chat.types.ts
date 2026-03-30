export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatStreamBody = {
  messages: ChatMessage[];
  mode?: 'debug' | 'production';
  sessionId?: string;
};
