"use client";

import { SearchOutlined } from "@ant-design/icons";
import { App, Input, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";

type Item = {
  id: string;
  name: string;
  description: string;
  access: string;
  publishedAt: string | null;
};

export default function MarketplacePage() {
  const { message } = App.useApp();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const url = new URL(`${getApiBase()}/marketplace/agents`);
          if (q.trim()) url.searchParams.set("q", q.trim());
          const res = await fetch(url.toString());
          if (!res.ok) throw new Error(String(res.status));
          setRows((await res.json()) as Item[]);
        } catch (e) {
          message.error(e instanceof Error ? e.message : "加载失败");
        } finally {
          setLoading(false);
        }
      })();
    }, 300);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const columns: ColumnsType<Item> = [
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "描述", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "权限(占位)",
      dataIndex: "access",
      key: "access",
      width: 140,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: "上架时间", dataIndex: "publishedAt", key: "publishedAt", width: 220 },
    {
      title: "操作",
      key: "a",
      width: 120,
      render: (_, row) => <Link href={`/chat/${row.id}`}>对话</Link>,
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        市场
      </Typography.Title>
      <Space orientation="vertical" style={{ width: "100%", marginBottom: 16 }} size="middle">
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="搜索名称 / 描述 / 提示词"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Space>
      <Table<Item> rowKey="id" loading={loading} columns={columns} dataSource={rows} />
    </div>
  );
}
