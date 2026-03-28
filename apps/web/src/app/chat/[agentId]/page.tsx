"use client";

import { SendOutlined } from "@ant-design/icons";
import { App, Button, Input, Space, Typography } from "antd";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { getApiBase, parseSseStream } from "@/lib/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const search = useSearchParams();
  const { message } = App.useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mode = useMemo(() => {
    const m = search.get("mode");
    return m === "debug" ? "debug" : "production";
  }, [search]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        }),
      });
      
      if (!res.ok) {
        throw new Error(`请求失败 ${res.status}`);
      }

      await parseSseStream(res.body, (event, data) => {
        if (event === "token" && data && typeof data === "object" && "text" in data) {
          const text = String((data as { text: string }).text);
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
    } catch (e) {
      message.error(e instanceof Error ? e.message : "发送失败");
      // 移除最后一条空的助手消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
      <Space orientation="vertical" size="middle" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Link href="/marketplace">市场</Link>
          <Link href={`/agents/${agentId}`}>配置</Link>
        </Space>
        <Typography.Title level={4} style={{ margin: 0 }}>
          对话 · {agentId.slice(0, 8)}…
        </Typography.Title>
        <Typography.Text type="secondary">
          模式：<Typography.Text strong>{mode}</Typography.Text>
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
        <Input.TextArea
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
  );
}
