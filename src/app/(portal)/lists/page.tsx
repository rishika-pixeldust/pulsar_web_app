import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Lists" };

export default function ListsPage() {
  return <EntityTablePage type="list" />;
}
