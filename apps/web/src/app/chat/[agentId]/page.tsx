"use client";

import { SendOutlined } from "@ant-design/icons";
import { App, Button, Card, Input, Space, Typography } from "antd";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getApiBase, parseSseStream } from "@/lib/api";

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const search = useSearchParams();
  const { message } = App.useApp();
  const mode = useMemo(() => {
    const m = search.get("mode");
    return m === "debug" ? "debug" : "production";
  }, [search]);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setOutput("");
    try {
      const res = await fetch(`${getApiBase()}/chat/${agentId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: [{ role: "user", content: input }],
        }),
      });
      if (!res.ok) {
        message.error(`请求失败 ${res.status}`);
        return;
      }
      let acc = "";
      await parseSseStream(res.body, (event, data) => {
        if (event === "token" && data && typeof data === "object" && "text" in data) {
          acc += String((data as { text: string }).text);
          setOutput(acc);
        }
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space wrap>
          <Link href="/marketplace">市场</Link>
          <Link href={`/agents/${agentId}`}>配置</Link>
        </Space>
        <Typography.Title level={4} style={{ margin: 0 }}>
          对话 · {agentId.slice(0, 8)}…
        </Typography.Title>
        <Typography.Text type="secondary">
          模式：<Typography.Text strong>{mode}</Typography.Text>（SSE 占位，未接真实模型）
        </Typography.Text>
        <Card size="small">
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Input.TextArea
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={busy}
              disabled={!input.trim()}
              onClick={() => void send()}
            >
              发送（流式）
            </Button>
            <Typography.Paragraph
              style={{
                minHeight: 120,
                marginBottom: 0,
                whiteSpace: "pre-wrap",
                padding: 12,
                background: "var(--ant-color-fill-tertiary, #fafafa)",
                borderRadius: 8,
              }}
            >
              {output || "…"}
            </Typography.Paragraph>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
