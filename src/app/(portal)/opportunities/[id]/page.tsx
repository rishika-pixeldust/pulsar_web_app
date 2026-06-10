import type { Metadata } from "next";

import { EntityDetailPage } from "@/components/crm/entity-detail-page";

export const metadata: Metadata = { title: "Opportunity" };

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetailPage type="opportunity" id={id} />;
}
