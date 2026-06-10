"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { useState } from "react";

import { EntityFormDialog } from "./entity-form-dialog";
import { FieldValue } from "./field-value";
import { RelatedEntityLink } from "./related-entity-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDefinitions, useEntity } from "@/hooks/use-crm";
import { entityDisplayName, formatRelative } from "@/lib/format";
import { CRM_OBJECTS } from "@/lib/lightfield/objects";
import type { CrmObjectType } from "@/lib/lightfield/types";

interface EntityDetailPageProps {
  type: CrmObjectType;
  id: string;
  /** Extra content rendered below the fields card (e.g. related record tables). */
  children?: React.ReactNode;
}

/** Generic record detail view: all fields, relationships, and edit support. */
export function EntityDetailPage({ type, id, children }: EntityDetailPageProps) {
  const config = CRM_OBJECTS[type];
  const { data: entity, isLoading, isError, error } = useEntity(type, id);
  const { data: definitions } = useDefinitions(type);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !entity) {
    return (
      <div className="space-y-4">
        <BackLink slug={config.slug} label={config.label} />
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Record not found"}
        </p>
      </div>
    );
  }

  const relationships = Object.entries(entity.relationships).filter(
    ([, relationship]) => relationship.values.length > 0,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink slug={config.slug} label={config.label} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {entityDisplayName(entity, config.primaryField)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {config.singular}
              {entity.updatedAt ? ` · updated ${formatRelative(entity.updatedAt)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {entity.httpLink ? (
              <Button variant="outline" asChild>
                <a href={entity.httpLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open in Lightfield
                </a>
              </Button>
            ) : null}
            {config.isWritable ? (
              <Button onClick={() => setIsEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {Object.entries(entity.fields).map(([key, field]) => (
              <div key={key} className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {definitions?.fieldDefinitions[key]?.label ?? key.replace(/^\$/, "")}
                </dt>
                <dd className="text-sm">
                  <FieldValue field={field} definition={definitions?.fieldDefinitions[key]} />
                </dd>
              </div>
            ))}
          </dl>

          {relationships.length > 0 ? (
            <>
              <Separator className="my-6" />
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {relationships.map(([key, relationship]) => (
                  <div key={key} className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {definitions?.relationshipDefinitions[key]?.label ?? key.replace(/^\$/, "")}
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {relationship.values.map((relatedId) => (
                        <RelatedEntityLink
                          key={relatedId}
                          objectType={relationship.objectType}
                          id={relatedId}
                        />
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </CardContent>
      </Card>

      {children}

      {config.isWritable ? (
        <EntityFormDialog
          type={type}
          entity={entity}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          title={`Edit ${config.singular.toLowerCase()}`}
        />
      ) : null}
    </div>
  );
}

function BackLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link
      href={`/${slug}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to {label}
    </Link>
  );
}
