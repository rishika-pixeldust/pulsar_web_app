"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useEntity } from "@/hooks/use-crm";
import { entityDisplayName } from "@/lib/format";
import { CRM_OBJECTS } from "@/lib/lightfield/objects";
import { isCrmObjectType } from "@/lib/lightfield/types";

interface RelatedEntityLinkProps {
  objectType: string;
  id: string;
}

/** A chip that resolves a related record's display name and links to it. */
export function RelatedEntityLink({ objectType, id }: RelatedEntityLinkProps) {
  const type = isCrmObjectType(objectType) ? objectType : null;
  const { data: entity } = useEntity(type ?? "account", type ? id : undefined);

  if (!type) return <Badge variant="outline">{id}</Badge>;

  const config = CRM_OBJECTS[type];
  const label = entity ? entityDisplayName(entity, config.primaryField) : id;

  if (type === "member" || type === "email") {
    return <Badge variant="outline">{label}</Badge>;
  }

  return (
    <Link href={`/${config.slug}/${id}`}>
      <Badge variant="outline" className="hover:bg-muted">
        {label}
      </Badge>
    </Link>
  );
}
