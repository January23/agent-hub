"use client";

import { SendOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Input, Space, Typography, List, Modal, Tooltip, Card, Divider } from "antd";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { getApiBase, parseSseStream } from "@/lib/api";
import { ChatMessage, ChatSession } from "@/lib/types";

const { TextArea } = Input;

// 本地存储会话数据
const STORAGE_KEY = "chat_sessions";

function getSessionsFromStorage(): ChatSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // 存储失败，忽略
  }
}

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const search = useSearchParams();
  const { message } = App.useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mode = useMemo(() => {
    const m = search.get("mode");
    return m === "debug" ? "debug" : "production";
  }, [search]);

  // 状态管理
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  
  // 编辑会话名称相关
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);

  // 加载会话数据
  useEffect(() => {
    const storedSessions = getSessionsFromStorage();
    const agentSessions = storedSessions.filter(s => s.agentId === agentId);
    setSessions(agentSessions);
  }, [agentId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 创建新会话
  function createNewSession() {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: `对话 ${sessions.length + 1}`,
      agentId: agentId!,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      round: 0,
    };
    
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSession(newSession);
    setSessionId(""); // 清空sessionId，让后端创建新会话
    setMessages([]);
    saveSessionsToStorage(updatedSessions);
  }

  // 切换会话 - 加载完整对话历史
  function switchSession(session: ChatSession) {
    setCurrentSession(session);
    setSessionId(session.id);
    setMessages([...session.messages]); // 加载完整的对话历史（用户提问 + Agent回复）
  }

  // 打开编辑会话名称模态框
  function openEditModal(session: ChatSession) {
    setEditingSessionId(session.id);
    setEditingName(session.name);
    setEditModalVisible(true);
  }

  // 保存会话名称
  function saveSessionName() {
    if (!editingSessionId || !editingName.trim()) {
      setEditModalVisible(false);
      return;
    }

    const updatedSessions = sessions.map(session =>
      session.id === editingSessionId
        ? { ...session, name: editingName.trim() }
        : session
    );
    
    setSessions(updatedSessions);
    if (currentSession?.id === editingSessionId) {
      setCurrentSession({ ...currentSession, name: editingName.trim() });
    }
    saveSessionsToStorage(updatedSessions);
    setEditModalVisible(false);
  }

  // 删除会话
  function deleteSession(sessionId: string) {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      if (updatedSessions.length > 0) {
        switchSession(updatedSessions[0]);
      } else {
        setCurrentSession(null);
        setSessionId("");
        setMessages([]);
      }
    }
    
    saveSessionsToStorage(updatedSessions);
  }

  async function send() {
    if (!input.trim() || busy) return;
    
    const userMessage = input.trim();
    setInput("");
    setBusy(true);
    
    try {
      // 添加用户消息
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      // 添加空的助手消息，等待流式填充
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const res = await fetch(`${getApiBase()}/chat/${agentId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: [{ role: "user", content: userMessage }],
          sessionId: sessionId || undefined,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`请求失败 ${res.status}`);
      }

      let newSessionId = sessionId;
      let assistantMessage = "";

      await parseSseStream(res.body, (event, data) => {
        if (event === "meta" && data && typeof data === "object" && "sessionId" in data) {
          newSessionId = String((data as { sessionId: string }).sessionId);
          setSessionId(newSessionId);
          
          // 如果是新会话，创建本地会话记录
          if (!sessionId) {
            const newSession: ChatSession = {
              id: newSessionId,
              name: `对话 ${sessions.length + 1}`,
              agentId: agentId!,
              messages: messages.concat([{ role: "user" as const, content: userMessage }]),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              round: 0,
            };
            const updatedSessions = [...sessions, newSession];
            setSessions(updatedSessions);
            setCurrentSession(newSession);
            saveSessionsToStorage(updatedSessions);
          }
        } else if (event === "token" && data && typeof data === "object" && "text" in data) {
          const text = String((data as { text: string }).text);
          assistantMessage += text;
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + text },
              ];
            }
            return prev;
          });
        } else if (event === "error") {
          throw new Error((data as { message?: string })?.message || "调用大模型失败");
        }
      });

      // 更新本地会话消息 - 存储完整对话历史（用户提问 + Agent回复）
      if (newSessionId) {
        const updatedSessions = sessions.map(session =>
          session.id === newSessionId
            ? {
                ...session,
                messages: [...session.messages, { role: "user" as const, content: userMessage }, { role: "assistant" as const, content: assistantMessage }],
                updatedAt: Date.now(),
                round: session.round + 1,
              }
            : session
        );
        setSessions(updatedSessions);
        if (currentSession?.id === newSessionId) {
          setCurrentSession({
            ...currentSession,
            messages: [...currentSession.messages, { role: "user" as const, content: userMessage }, { role: "assistant" as const, content: assistantMessage }],
            updatedAt: Date.now(),
            round: currentSession.round + 1,
          });
        }
        saveSessionsToStorage(updatedSessions);
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : "发送失败");
      // 移除最后一条空的助手消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ height: "calc(100vh - 180px)", display: "flex" }}>
      {/* 左侧对话历史区域 */}
      <div
        style={{
          width: 280,
          borderRight: "1px solid #f0f0f0",
          padding: 16,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Space style={{ marginBottom: 16 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>对话历史</Typography.Title>
          <Tooltip title="新建对话">
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={createNewSession}
            />
          </Tooltip>
        </Space>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((session) => (
            <Card
              key={session.id}
              style={{
                cursor: "pointer",
                borderRadius: 8,
                marginBottom: 0,
                backgroundColor: currentSession?.id === session.id ? "#f0f7ff" : "transparent",
                border: currentSession?.id === session.id ? "1px solid #1677ff" : "1px solid #f0f0f0",
              }}
              onClick={() => switchSession(session)}
              styles={{
                body: { padding: 12 }
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: currentSession?.id === session.id ? "bold" : "normal" }}>
                  {session.name}
                </span>
                <Space size={4}>
                  <Tooltip title="编辑名称">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(session);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="删除对话">
                    <Button 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      size="small"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    />
                  </Tooltip>
                </Space>
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>
                <div>消息数: {session.messages.length}</div>
                <div>{new Date(session.updatedAt).toLocaleString()}</div>
              </div>
            </Card>
          ))}
        </div>
        
        {sessions.length === 0 && (
          <Card style={{ marginTop: 16, textAlign: "center" }}>
            <Typography.Text type="secondary">
              暂无对话历史
            </Typography.Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              style={{ marginTop: 16 }}
              onClick={createNewSession}
            >
              开始新对话
            </Button>
          </Card>
        )}
      </div>

      {/* 右侧聊天区域 */}
      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column" }}>
        <Space orientation="vertical" size="middle" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Link href="/marketplace">市场</Link>
            <Link href={`/agents/${agentId}`}>配置</Link>
          </Space>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {currentSession ? currentSession.name : `对话 · ${agentId.slice(0, 8)}…`}
          </Typography.Title>
          <Typography.Text type="secondary">
            模式：<Typography.Text strong>{mode}</Typography.Text>
            {sessionId && <span style={{ marginLeft: 16 }}>会话ID：{sessionId.slice(0, 8)}…</span>}
          </Typography.Text>
        </Space>

        {/* 消息列表区域 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {messages.length === 0 ? (
            <Typography.Text
              type="secondary"
              style={{ textAlign: "center", marginTop: 60 }}
            >
              开始对话吧
            </Typography.Text>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  maxWidth: "70%",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  padding: "10px 14px",
                  borderRadius: 18,
                  background: msg.role === "user" ? "#1677ff" : "#f0f0f0",
                  color: msg.role === "user" ? "#fff" : "inherit",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  minHeight: msg.role === "assistant" && !msg.content && busy ? 40 : "auto",
                }}
              >
                {msg.content ? (
                  msg.content
                ) : msg.role === "assistant" && busy ? (
                  <span style={{ display: "inline-block", animation: "typing 1.4s infinite" }}>
                    •••
                  </span>
                ) : null}
              </div>
            ))
          )}
          
          <style jsx global>{`
            @keyframes typing {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 1; }
            }
          `}</style>
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <Space.Compact style={{ width: "100%", marginTop: 16 }}>
          <TextArea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={busy}
            style={{ resize: "none" }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={busy}
            disabled={!input.trim()}
            onClick={() => void send()}
            style={{ height: "auto" }}
          >
            发送
          </Button>
        </Space.Compact>
      </div>

      {/* 编辑会话名称模态框 */}
      <Modal
        title="编辑会话名称"
        open={editModalVisible}
        onOk={saveSessionName}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          placeholder="请输入会话名称"
          maxLength={50}
        />
      </Modal>
    </div>
  );
}
