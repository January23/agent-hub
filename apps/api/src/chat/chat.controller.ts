import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AgentsService } from '../agents/agents.service';
import type { ChatStreamBody } from './chat.types';

function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

@Controller('chat')
export class ChatController {
  constructor(private readonly agents: AgentsService) {}

  /**
   * SSE 流式占位：未接真实大模型。
   * TODO: 接入 LLM streaming；TODO: 按 viewer + agentId 限流。
   */
  @Post(':agentId/stream')
  stream(
    @Param('agentId') agentId: string,
    @Body() body: ChatStreamBody,
    @Res({ passthrough: false }) res: Response,
  ): void {
    const agent = this.agents.get(agentId);
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

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const prefix =
      mode === 'debug'
        ? '[调试] 使用 Agent 配置预览（未接 LLM）。\n系统提示摘要：'
        : '（生产占位）';
    const summary = agent.prompt.slice(0, 160);
    const echo = lastUser?.content ?? '';
    const text = `${prefix}\n${summary}${echo ? `\n\n用户：${echo}` : ''}\n\n回复：这是流式占位输出，后续替换为真实模型 token。`;

    for (const ch of text) {
      sseWrite(res, 'token', { text: ch });
    }

    sseWrite(res, 'done', {});
    res.end();
  }
}
