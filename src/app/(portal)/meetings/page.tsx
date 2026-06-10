import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Meetings" };

export default function MeetingsPage() {
  return <EntityTablePage type="meeting" />;
}
