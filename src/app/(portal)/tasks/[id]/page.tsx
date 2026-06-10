import type { Metadata } from "next";

import { EntityDetailPage } from "@/components/crm/entity-detail-page";

export const metadata: Metadata = { title: "Task" };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetailPage type="task" id={id} />;
}
