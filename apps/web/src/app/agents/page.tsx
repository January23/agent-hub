"use client";

import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import type { AgentDTO } from "@/lib/types";

export default function AgentsPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<AgentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const res = await fetch(`${getApiBase()}/agents`);
    if (!res.ok) throw new Error(String(res.status));
    setData((await res.json()) as AgentDTO[]);
  }

  useEffect(() => {
    void (async () => {
      try {
        await reload();
      } catch {
        message.error("加载失败");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<AgentDTO> = [
    { title: "名称", dataIndex: "name", key: "name" },
    {
      title: "状态",
      dataIndex: "published",
      key: "published",
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">已上架</Tag> : <Tag>草稿</Tag>),
    },
    { title: "Owner", dataIndex: "ownerSubject", key: "ownerSubject", ellipsis: true, render: (v) => v ?? "—" },
    { title: "更新于", dataIndex: "updatedAt", key: "updatedAt", width: 200 },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap>
          <Link href={`/agents/${row.id}`}>配置</Link>
          <Link href={`/chat/${row.id}?mode=production`}>对话</Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Agent 列表
      </Typography.Title>
      <Space style={{ marginBottom: 16 }} align="center">
        <Link href="/agents/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新建 Agent
          </Button>
        </Link>
      </Space>
      <Table<AgentDTO>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
