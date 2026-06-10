import type { Metadata } from "next";

import { ListDetailView } from "./list-detail-view";

export const metadata: Metadata = { title: "List" };

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListDetailView id={id} />;
}
