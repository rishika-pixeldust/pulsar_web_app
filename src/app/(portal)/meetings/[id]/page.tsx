import type { Metadata } from "next";

import { EntityDetailPage } from "@/components/crm/entity-detail-page";

export const metadata: Metadata = { title: "Meeting" };

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetailPage type="meeting" id={id} />;
}
