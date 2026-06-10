import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return <EntityTablePage type="note" />;
}
