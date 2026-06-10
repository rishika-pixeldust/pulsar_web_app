import type { Metadata } from "next";

import { EntityDetailPage } from "@/components/crm/entity-detail-page";

export const metadata: Metadata = { title: "Note" };

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetailPage type="note" id={id} />;
}
