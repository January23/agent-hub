import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import OpenAI from 'openai';
import { AgentsService } from '../agents/agents.service';
import type { ChatStreamBody } from './chat.types';

function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

@Controller('chat')
export class ChatController {
  constructor(private readonly agents: AgentsService) {}

  /**
   * SSE 流式对话接口，使用用户配置的大模型
   * TODO: 按 viewer + agentId 限流。
   */
  @Post(':agentId/stream')
  async stream(
    @Param('agentId') agentId: string,
    @Body() body: ChatStreamBody,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const agent = await this.agents.get(agentId);
    if (!agent) {
      res.status(404).json({ message: `Agent ${agentId} not found` });
      return;
    }

    const mode = body.mode ?? 'production';
    const messages = body.messages ?? [];
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    sseWrite(res, 'meta', {
      agentId: agent.id,
      mode,
      model: agent.model,
    });

    try {
      const apiKey = agent.model.apiKey;
      const baseURL = agent.model.baseUrl;

      if (!baseURL) {
        throw new Error('请配置大模型 API 地址');
      }

      const openai = new OpenAI({
        apiKey,
        baseURL,
        timeout: 120000,
      });

      console.log(`[LLM Request] Agent: ${agent.name} (${agent.id}), Provider: ${agent.model.provider}, Model: ${agent.model.model}, Messages:`, messages);
      
      const stream = await openai.chat.completions.create({
        model: agent.model.model,
        temperature: agent.model.temperature ?? 0.2,
        messages: [
          { role: 'system', content: agent.prompt },
          ...messages,
        ],
        stream: true
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          fullResponse += text;
          sseWrite(res, 'token', { text });
        }
      }

      console.log(`[LLM Response] Agent: ${agent.name} (${agent.id}), Full Output:\n${fullResponse}\n`);
    } catch (error) {
      console.error(`[LLM Error] Agent: ${agent.name} (${agent.id}), Error:`, error);
      sseWrite(res, 'error', {
        message: error instanceof Error ? error.message : '调用大模型失败',
      });
    } finally {
      sseWrite(res, 'done', {});
      res.end();
    }
  }
}
