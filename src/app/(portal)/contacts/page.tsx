import type { Metadata } from "next";

import { EntityTablePage } from "@/components/crm/entity-table-page";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <EntityTablePage type="contact" />;
}
