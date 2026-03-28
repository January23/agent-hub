"use client";

import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getApiBase } from "@/lib/api";
import type { AgentDTO, AgentEditorCatalog } from "@/lib/types";

export type AgentConfigFormProps =
  | { mode: "create" }
  | { mode: "edit"; agentId: string };

export function AgentConfigForm(props: AgentConfigFormProps) {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm();
  const [catalog, setCatalog] = useState<AgentEditorCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [agent, setAgent] = useState<AgentDTO | null>(null);

  const mode = props.mode;
  const agentId = mode === "edit" ? props.agentId : undefined;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setBootLoading(true);
      try {
        const rc = await fetch(`${getApiBase()}/catalog/agent-editor`);
        if (!rc.ok) throw new Error(`catalog ${rc.status}`);
        const cat = (await rc.json()) as AgentEditorCatalog;
        if (!cancelled) setCatalog(cat);

        if (mode === "edit" && agentId) {
          const ra = await fetch(`${getApiBase()}/agents/${agentId}`);
          if (!ra.ok) throw new Error(`agent ${ra.status}`);
          const ag = (await ra.json()) as AgentDTO;
          if (!cancelled) {
            setAgent(ag);
            form.setFieldsValue({
              name: ag.name,
              description: ag.description,
              prompt: ag.prompt,
              skillIds: ag.skillIds,
              mcpConfigIds: ag.mcpConfigIds,
              knowledgeBaseIds: ag.knowledgeBaseIds,
              linkedAgentIds: ag.linkedAgentIds,
              model: ag.model,
            });
          }
        }
      } catch (e) {
        if (!cancelled) {
          message.error(e instanceof Error ? e.message : "加载失败");
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, form, message, mode]);

  const skillOptions = useMemo(
    () => catalog?.skills.map((s) => ({ label: s.name, value: s.id })) ?? [],
    [catalog],
  );
  const mcpOptions = useMemo(
    () => catalog?.mcpConfigs.map((m) => ({ label: m.name, value: m.id })) ?? [],
    [catalog],
  );
  const kbOptions = useMemo(
    () => catalog?.knowledgeBases.map((k) => ({ label: k.name, value: k.id })) ?? [],
    [catalog],
  );
  const linkedOptions = useMemo(() => {
    if (!catalog) return [];
    return catalog.agents
      .filter((a) => (agentId ? a.id !== agentId : true))
      .map((a) => ({
        label: `${a.name}${a.published ? " · 已上架" : ""}`,
        value: a.id,
      }));
  }, [catalog, agentId]);

  async function onSave() {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (props.mode === "create") {
        const res = await fetch(`${getApiBase()}/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error(String(res.status));
        const created = (await res.json()) as AgentDTO;
        message.success("已创建");
        router.replace(`/agents/${created.id}`);
        return;
      }
      const res = await fetch(`${getApiBase()}/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(String(res.status));
      setAgent((await res.json()) as AgentDTO);
      message.success("已保存");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  function publish(pub: boolean) {
    if (!agentId) return;
    modal.confirm({
      title: pub ? "发布到市场？" : "确认下架？",
      onOk: async () => {
        const path = pub ? "publish" : "unpublish";
        const res = await fetch(`${getApiBase()}/agents/${agentId}/${path}`, { method: "POST" });
        if (!res.ok) {
          message.error(`操作失败 ${res.status}`);
          return;
        }
        setAgent((await res.json()) as AgentDTO);
        message.success(pub ? "已上架" : "已下架");
      },
    });
  }

  function remove() {
    if (!agentId) return;
    modal.confirm({
      title: "删除 Agent？",
      okType: "danger",
      onOk: async () => {
        const res = await fetch(`${getApiBase()}/agents/${agentId}`, { method: "DELETE" });
        if (!res.ok) {
          message.error(`删除失败 ${res.status}`);
          return;
        }
        message.success("已删除");
        router.replace("/agents");
      },
    });
  }

  if (bootLoading) {
    return <Typography.Paragraph>加载配置…</Typography.Paragraph>;
  }

  return (
    <Card
      title={
        props.mode === "create" ? (
          "新建 Agent"
        ) : (
          <Space>
            <span>配置 Agent</span>
            {agent?.published ? (
              <Typography.Text type="success">已上架</Typography.Text>
            ) : (
              <Typography.Text type="secondary">草稿</Typography.Text>
            )}
          </Space>
        )
      }
      extra={
        props.mode === "edit" && agentId ? (
          <Space wrap>
            <Link href={`/chat/${agentId}?mode=debug`}>调试对话</Link>
            <Link href={`/chat/${agentId}?mode=production`}>生产对话</Link>
          </Space>
        ) : null
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          skillIds: [],
          mcpConfigIds: [],
          knowledgeBaseIds: [],
          linkedAgentIds: [],
          model: { provider: "openai-compatible", model: "gpt-4o-mini", temperature: 0.2 },
          prompt: "你是企业内部助手。",
        }}
      >
        <Form.Item name="name" label="名称" rules={[{ required: true, message: "必填" }]}>
          <Input placeholder="Agent 名称" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input placeholder="简述用途" />
        </Form.Item>
        <Form.Item name="prompt" label="系统提示词" rules={[{ required: true, message: "必填" }]}>
          <Input.TextArea rows={10} placeholder="系统 / 开发者提示词" />
        </Form.Item>

        <Divider titlePlacement="start">关联资源</Divider>
        <Form.Item name="skillIds" label="Skills">
          <Select
            mode="multiple"
            allowClear
            showSearch
            options={skillOptions}
            placeholder="选择 Skills"
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="mcpConfigIds" label="MCP 配置">
          <Select
            mode="multiple"
            allowClear
            showSearch
            options={mcpOptions}
            placeholder="选择 MCP"
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="knowledgeBaseIds" label="知识库">
          <Select
            mode="multiple"
            allowClear
            showSearch
            options={kbOptions}
            placeholder="选择知识库"
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="linkedAgentIds" label="关联 Agent">
          <Select
            mode="multiple"
            allowClear
            showSearch
            options={linkedOptions}
            placeholder="编排其他 Agent（不含自身）"
            optionFilterProp="label"
          />
        </Form.Item>

        <Divider titlePlacement="start">大模型</Divider>
        <Form.Item name={["model", "provider"]} label="Provider" rules={[{ required: true }]}>
          <Input placeholder="如 openai-compatible" />
        </Form.Item>
        <Form.Item name={["model", "model"]} label="模型名" rules={[{ required: true }]}>
          <Input placeholder="如 gpt-4o-mini" />
        </Form.Item>
        <Form.Item name={["model", "temperature"]} label="温度">
          <InputNumber min={0} max={2} step={0.1} style={{ width: "100%" }} />
        </Form.Item>

        <Space wrap>
          <Button
            type="primary"
            icon={props.mode === "create" ? <PlusOutlined /> : <SaveOutlined />}
            loading={loading}
            onClick={() => void onSave()}
          >
            {props.mode === "create" ? "创建" : "保存"}
          </Button>
          {props.mode === "edit" ? (
            <>
              <Button disabled={!agent || agent.published} onClick={() => publish(true)}>
                发布到市场
              </Button>
              <Button disabled={!agent || !agent.published} onClick={() => publish(false)}>
                下架
              </Button>
              <Button danger onClick={() => remove()}>
                删除
              </Button>
              <Link href="/agents">返回列表</Link>
            </>
          ) : (
            <Link href="/agents">返回</Link>
          )}
        </Space>
      </Form>
    </Card>
  );
}
