import type { Metadata } from "next";

import { EntityDetailPage } from "@/components/crm/entity-detail-page";

export const metadata: Metadata = { title: "Email" };

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetailPage type="email" id={id} />;
}
