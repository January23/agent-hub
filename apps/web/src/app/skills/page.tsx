"use client";

import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Drawer, Form, Input, Popconfirm, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";

type Skill = {
  id: string;
  name: string;
  description: string;
  definition: string;
  updatedAt: string;
};

export default function SkillsPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const res = await fetch(`${getApiBase()}/skills`);
    if (!res.ok) throw new Error(String(res.status));
    setRows((await res.json()) as Skill[]);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch {
        message.error("加载失败");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(row: Skill) {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    try {
      if (editing) {
        const res = await fetch(`${getApiBase()}/skills/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        });
        if (!res.ok) throw new Error(String(res.status));
        message.success("已保存");
      } else {
        const res = await fetch(`${getApiBase()}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        });
        if (!res.ok) throw new Error(String(res.status));
        message.success("已创建");
      }
      setOpen(false);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "失败");
    }
  }

  async function removeRow(id: string) {
    const res = await fetch(`${getApiBase()}/skills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      message.error(`删除失败 ${res.status}`);
      return;
    }
    message.success("已删除");
    await load();
  }

  const columns: ColumnsType<Skill> = [
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "描述", dataIndex: "description", key: "description", ellipsis: true },
    { title: "更新于", dataIndex: "updatedAt", key: "updatedAt", width: 200 },
    {
      title: "操作",
      key: "a",
      width: 160,
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => openEdit(row)} style={{ padding: 0 }}>
            编辑
          </Button>
          <Popconfirm title="删除？" onConfirm={() => void removeRow(row.id)}>
            <Button type="link" danger style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Skills
      </Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建 Skill
        </Button>
      </Space>
      <Table<Skill> rowKey="id" loading={loading} columns={columns} dataSource={rows} />
      <Drawer
        title={editing ? "编辑 Skill" : "新建 Skill"}
        width={480}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => void submit()}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input />
          </Form.Item>
          <Form.Item name="definition" label="定义 / 内容">
            <Input.TextArea rows={10} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
