"use client";

import { AgentConfigForm } from "@/components/agents/AgentConfigForm";
import { useParams } from "next/navigation";

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  return <AgentConfigForm mode="edit" agentId={id} />;
}
