"use client";

import Link from "next/link";
import { Columns3, MoreHorizontal, Plus, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EntityFormDialog } from "@/components/crm/entity-form-dialog";
import { EntityTablePage } from "@/components/crm/entity-table-page";
import { RelatedEntityLink } from "@/components/crm/related-entity-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDefinitions, useEntityList, useUpdateEntity } from "@/hooks/use-crm";
import { entityDisplayName, formatCurrency, formatDateTime, resolveOptionLabel } from "@/lib/format";
import type { CrmEntity, SelectOption } from "@/lib/lightfield/types";

export function OpportunitiesView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Tabs defaultValue="board" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground">Track deals through your pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="board">
              <Columns3 className="size-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 className="size-4" />
              Table
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            New opportunity
          </Button>
        </div>
      </div>

      <TabsContent value="board">
        <PipelineBoard />
      </TabsContent>
      <TabsContent value="table">
        <EntityTablePage type="opportunity" />
      </TabsContent>

      <EntityFormDialog
        type="opportunity"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="New opportunity"
      />
    </Tabs>
  );
}

function PipelineBoard() {
  const { data: definitions } = useDefinitions("opportunity");
  const { data, isLoading } = useEntityList("opportunity", { limit: 25 });

  const stageDefinition = useMemo(() => {
    const entries = Object.entries(definitions?.fieldDefinitions ?? {});
    return (
      entries.find(([key]) => key === "$stage") ??
      entries.find(([, def]) => def.valueType === "SINGLE_SELECT" && /stage/i.test(def.label))
    );
  }, [definitions]);

  const stages: SelectOption[] = useMemo(
    () => stageDefinition?.[1].typeConfiguration?.options ?? [],
    [stageDefinition],
  );
  const stageKey = stageDefinition?.[0] ?? "$stage";

  const grouped = useMemo(() => {
    const map = new Map<string, CrmEntity[]>();
    for (const stage of stages) map.set(stage.label, []);
    for (const opportunity of data?.data ?? []) {
      const raw = opportunity.fields[stageKey]?.value;
      const label = resolveOptionLabel(raw, stageDefinition?.[1]) || "No stage";
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(opportunity);
    }
    return map;
  }, [data, stages, stageKey, stageDefinition]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...grouped.entries()].map(([stageLabel, opportunities]) => (
        <div key={stageLabel} className="w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">{stageLabel}</h2>
            <span className="text-xs text-muted-foreground">
              {opportunities.length} ·{" "}
              {formatCurrency(
                opportunities.reduce((sum, opp) => sum + (Number(opp.fields.$amount?.value) || 0), 0),
              )}
            </span>
          </div>
          <div className="space-y-2">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                stages={stages}
                stageKey={stageKey}
              />
            ))}
            {opportunities.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No deals
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  stages,
  stageKey,
}: {
  opportunity: CrmEntity;
  stages: SelectOption[];
  stageKey: string;
}) {
  const updateMutation = useUpdateEntity("opportunity");
  const accountRelationship = opportunity.relationships.$account;
  const accountId = accountRelationship?.values[0];

  async function moveToStage(option: SelectOption) {
    try {
      await updateMutation.mutateAsync({
        id: opportunity.id,
        body: { fields: { [stageKey]: option.id } },
      });
      toast.success(`Moved to ${option.label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move deal");
    }
  }

  return (
    <Card className="py-3">
      <CardContent className="space-y-2 px-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="text-sm font-medium leading-snug hover:underline"
          >
            {entityDisplayName(opportunity, "$name")}
          </Link>
          {stages.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label="Move deal">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
                {stages.map((option) => (
                  <DropdownMenuItem key={option.id} onClick={() => moveToStage(option)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <p className="text-sm font-semibold">
          {formatCurrency(opportunity.fields.$amount?.value ?? 0)}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {accountId ? <RelatedEntityLink objectType="account" id={accountId} /> : null}
          {opportunity.fields.$closeDate?.value ? (
            <span className="text-xs text-muted-foreground">
              Close {formatDateTime(opportunity.fields.$closeDate.value)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
