import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return <EntityTablePage type="account" />;
}
