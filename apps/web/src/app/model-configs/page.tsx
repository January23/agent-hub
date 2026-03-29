"use client";

import { PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";

type ModelConfig = {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  apiKey: string;
  baseUrl: string;
  description: string;
  updatedAt: string;
};

export default function ModelConfigsPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm();

  // Reset/set form values when drawer opens
  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue(editing);
      } else {
        form.resetFields();
      }
    }
  }, [open, editing, form]);

  const load = useCallback(async () => {
    const res = await fetch(`${getApiBase()}/model-configs`);
    if (!res.ok) throw new Error(String(res.status));
    setRows((await res.json()) as ModelConfig[]);
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
    setOpen(true);
  }

  function openEdit(row: ModelConfig) {
    setEditing(row);
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    try {
      if (editing) {
        const res = await fetch(`${getApiBase()}/model-configs/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        });
        if (!res.ok) throw new Error(String(res.status));
        message.success("已保存");
      } else {
        const res = await fetch(`${getApiBase()}/model-configs`, {
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
    const res = await fetch(`${getApiBase()}/model-configs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      message.error(`删除失败 ${res.status}`);
      return;
    }
    message.success("已删除");
    await load();
  }

  const columns: ColumnsType<ModelConfig> = [
    { title: "配置名称", dataIndex: "name", key: "name", width: 180 },
    { title: "提供商", dataIndex: "provider", key: "provider", width: 150 },
    { title: "模型名", dataIndex: "model", key: "model", width: 180 },
    { title: "温度", dataIndex: "temperature", key: "temperature", width: 80 },
    { title: "API地址", dataIndex: "baseUrl", key: "baseUrl", ellipsis: true },
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
        大模型配置
      </Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增大模型
        </Button>
      </Space>
      <Table<ModelConfig> rowKey="id" loading={loading} columns={columns} dataSource={rows} />
      <Drawer
        title={editing ? "编辑大模型" : "新增大模型"}
        size="default"
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
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: "必填" }]}>
            <Input placeholder="如：OpenAI GPT-4o" />
          </Form.Item>
          <Form.Item name="provider" label="提供商" rules={[{ required: true, message: "必填" }]}>
            <Input placeholder="如：openai-compatible" />
          </Form.Item>
          <Form.Item name="model" label="模型名" rules={[{ required: true, message: "必填" }]}>
            <Input placeholder="如：gpt-4o-mini" />
          </Form.Item>
          <Form.Item name="temperature" label="温度" initialValue={0.2}>
            <InputNumber min={0} max={2} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item 
            name="apiKey" 
            label="API Key" // 👇 ANTD 6 最佳动态校验写法
            dependencies={['baseUrl']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const baseUrl = getFieldValue('baseUrl');
                  const isLocal = !baseUrl || baseUrl.includes('localhost')  || baseUrl.includes('127.0.0.1');
                  // 远程地址 → 必填
                  if (isLocal || value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('远程地址必须填写 API Key'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="API密钥" />
          </Form.Item>
          <Form.Item name="baseUrl" label="API 地址" rules={[{ required: true, message: "必填" }]}>
            <Input placeholder="如：https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="描述用途" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
