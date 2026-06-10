import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <EntityTablePage type="task" />;
}
