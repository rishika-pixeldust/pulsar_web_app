"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FieldValue } from "@/components/crm/field-value";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDefinitions, useEntity, useListMembers } from "@/hooks/use-crm";
import { entityDisplayName } from "@/lib/format";
import { CRM_OBJECTS } from "@/lib/lightfield/objects";

type MemberType = "account" | "contact" | "opportunity";

export function ListDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: list, isLoading, isError, error } = useEntity("list", id);

  const rawObjectType = String(list?.fields.$objectType?.value ?? "account").toLowerCase();
  const memberType: MemberType = (["account", "contact", "opportunity"] as const).includes(
    rawObjectType as MemberType,
  )
    ? (rawObjectType as MemberType)
    : "account";

  const { data: members, isLoading: isLoadingMembers } = useListMembers(
    list ? id : undefined,
    memberType,
  );
  const { data: definitions } = useDefinitions(memberType);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !list) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-destructive">{error instanceof Error ? error.message : "List not found"}</p>
      </div>
    );
  }

  const config = CRM_OBJECTS[memberType];
  const columns = config.preferredColumns;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {entityDisplayName(list, "$name")}
          </h1>
          <p className="text-sm text-muted-foreground">
            List of {config.label.toLowerCase()}
            {members ? ` · ${members.totalCount} record${members.totalCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((key) => (
                <TableHead key={key}>
                  {definitions?.fieldDefinitions[key]?.label ?? key.replace(/^\$/, "")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingMembers ? (
              Array.from({ length: 3 }).map((_, row) => (
                <TableRow key={row}>
                  {columns.map((key) => (
                    <TableCell key={key}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (members?.data.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  This list is empty.
                </TableCell>
              </TableRow>
            ) : (
              members?.data.map((entity) => (
                <TableRow
                  key={entity.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/${config.slug}/${entity.id}`)}
                >
                  {columns.map((key) => (
                    <TableCell key={key} className={key === columns[0] ? "font-medium" : undefined}>
                      <FieldValue
                        field={entity.fields[key]}
                        definition={definitions?.fieldDefinitions[key]}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/lists"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to Lists
    </Link>
  );
}
