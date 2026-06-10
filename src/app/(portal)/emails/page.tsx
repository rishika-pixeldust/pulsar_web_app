import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Emails" };

export default function EmailsPage() {
  return <EntityTablePage type="email" searchField="$subject" />;
}
