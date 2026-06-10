"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EntityFormDialog } from "./entity-form-dialog";
import { FieldValue } from "./field-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDefinitions, useEntityList } from "@/hooks/use-crm";
import { CRM_OBJECTS } from "@/lib/lightfield/objects";
import type { CrmObjectType } from "@/lib/lightfield/types";

const PAGE_SIZE = 25;

interface EntityTablePageProps {
  type: CrmObjectType;
  /** Field used by the search box (must support startsWith/contains filtering). */
  searchField?: string;
  searchOperator?: "startsWith" | "contains";
}

/**
 * Generic list page for a CRM object type: searchable, paginated table with
 * definitions-driven columns and a create dialog for writable types.
 */
export function EntityTablePage({
  type,
  searchField,
  searchOperator = "startsWith",
}: EntityTablePageProps) {
  const router = useRouter();
  const config = CRM_OBJECTS[type];
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const effectiveSearchField = searchField ?? config.primaryField;
  const filters = useMemo(() => {
    if (!search.trim()) return {};
    return { [`${effectiveSearchField}[${searchOperator}]`]: search.trim() };
  }, [search, effectiveSearchField, searchOperator]);

  const { data: definitions } = useDefinitions(type);
  const { data, isLoading, isError, error } = useEntityList(type, {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    filters,
  });

  const columns = useMemo(() => {
    const known = new Set(Object.keys(definitions?.fieldDefinitions ?? {}));
    const preferred = config.preferredColumns.filter(
      (key) => known.size === 0 || known.has(key),
    );
    if (preferred.length > 0) return preferred;
    return Object.keys(definitions?.fieldDefinitions ?? {}).slice(0, 5);
  }, [definitions, config.preferredColumns]);

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.label}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${totalCount} record${totalCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder={`Search ${config.label.toLowerCase()}…`}
              className="w-full pl-8 sm:w-64"
            />
          </div>
          {config.isWritable ? (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              New {config.singular.toLowerCase()}
            </Button>
          ) : null}
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, row) => (
                <TableRow key={row}>
                  {columns.map((key) => (
                    <TableCell key={key}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} className="py-10 text-center text-destructive">
                  {error instanceof Error ? error.message : "Failed to load records"}
                </TableCell>
              </TableRow>
            ) : (data?.data.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className="py-10 text-center text-muted-foreground"
                >
                  No {config.label.toLowerCase()} found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((entity) => (
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {config.isWritable ? (
        <EntityFormDialog
          type={type}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title={`New ${config.singular.toLowerCase()}`}
        />
      ) : null}
    </div>
  );
}
