import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from './chat.types';

export type ChatSession = {
  id: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  round: number;
};

const MAX_SESSIONS = 10000;
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24小时过期

@Injectable()
export class ChatSessionService {
  private sessions = new Map<string, ChatSession>();

  /**
   * 创建新会话
   */
  create(agentId: string, initialMessages: ChatMessage[] = []): ChatSession {
    this.cleanupExpiredSessions();

    const sessionId = uuidv4();
    const session: ChatSession = {
      id: sessionId,
      agentId,
      messages: initialMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      round: 0,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取会话
   */
  get(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // 检查是否过期
    if (Date.now() - session.updatedAt > SESSION_TTL) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * 更新会话消息 - 存储完整对话历史（用户提问 + Agent回复）
   */
  updateMessages(sessionId: string, messages: ChatMessage[], incrementRound = true): ChatSession | null {
    const session = this.get(sessionId);
    if (!session) return null;

    session.messages = messages;
    session.updatedAt = Date.now();
    if (incrementRound) {
      session.round += 1;
    }

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 追加消息到会话 - 存储所有消息类型
   */
  appendMessage(sessionId: string, message: ChatMessage): ChatSession | null {
    const session = this.get(sessionId);
    if (!session) return null;

    session.messages.push(message);
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 删除会话
   */
  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * 清理过期会话
   */
  private cleanupExpiredSessions(): void {
    if (this.sessions.size > MAX_SESSIONS) {
      // 会话数量超过上限，删除最旧的20%
      const sortedSessions = Array.from(this.sessions.values())
        .sort((a, b) => a.updatedAt - b.updatedAt);
      const deleteCount = Math.floor(MAX_SESSIONS * 0.2);
      sortedSessions.slice(0, deleteCount).forEach(session => {
        this.sessions.delete(session.id);
      });
    }

    // 删除过期会话
    const now = Date.now();
    Array.from(this.sessions.values()).forEach(session => {
      if (now - session.updatedAt > SESSION_TTL) {
        this.sessions.delete(session.id);
      }
    });
  }
}
