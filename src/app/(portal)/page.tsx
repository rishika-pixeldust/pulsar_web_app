import Link from "next/link";
import { Building2, CheckSquare, Target, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  entityDisplayName,
  formatCurrency,
  formatDateTime,
  formatRelative,
  resolveOptionLabel,
} from "@/lib/format";
import { getCrmSource } from "@/lib/lightfield";
import type { CrmEntity } from "@/lib/lightfield/types";

export const dynamic = "force-dynamic";

function fieldString(entity: CrmEntity, key: string): string {
  const value = entity.fields[key]?.value;
  return value === null || value === undefined ? "" : String(value);
}

async function getDashboardData() {
  const source = getCrmSource();
  const [accounts, contacts, opportunities, tasks, notes, opportunityDefs] = await Promise.all([
    source.list("account", { limit: 1 }),
    source.list("contact", { limit: 1 }),
    source.list("opportunity", { limit: 25 }),
    source.list("task", { limit: 25 }),
    source.list("note", { limit: 5 }),
    source.definitions("opportunity").catch(() => null),
  ]);
  return { accounts, contacts, opportunities, tasks, notes, opportunityDefs };
}

export default async function DashboardPage() {
  const { accounts, contacts, opportunities, tasks, notes, opportunityDefs } =
    await getDashboardData();

  const stageDefinition = opportunityDefs?.fieldDefinitions["$stage"];
  const stageLabel = (opportunity: CrmEntity) =>
    resolveOptionLabel(opportunity.fields.$stage?.value, stageDefinition);

  const openOpportunities = opportunities.data.filter(
    (opportunity) => !/closed|won|lost/i.test(stageLabel(opportunity)),
  );
  const pipelineValue = openOpportunities.reduce(
    (sum, opportunity) => sum + (Number(opportunity.fields.$amount?.value) || 0),
    0,
  );

  const stageBreakdown = new Map<string, { count: number; value: number }>();
  for (const opportunity of openOpportunities) {
    const stage = stageLabel(opportunity) || "No stage";
    const entry = stageBreakdown.get(stage) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += Number(opportunity.fields.$amount?.value) || 0;
    stageBreakdown.set(stage, entry);
  }

  const dueAt = (task: CrmEntity) => fieldString(task, "$dueAt") || fieldString(task, "$dueDate");
  const openTasks = tasks.data
    .filter((task) => !fieldString(task, "$status").toLowerCase().match(/done|complete|cancel/))
    .sort((a, b) => dueAt(a).localeCompare(dueAt(b)))
    .slice(0, 6);

  const metrics = [
    { label: "Accounts", value: accounts.totalCount, icon: Building2, href: "/accounts" },
    { label: "Contacts", value: contacts.totalCount, icon: Users, href: "/contacts" },
    { label: "Open opportunities", value: openOpportunities.length, icon: Target, href: "/opportunities" },
    { label: "Open tasks", value: openTasks.length, icon: CheckSquare, href: "/tasks" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline value: <span className="font-medium text-foreground">{formatCurrency(pipelineValue)}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Pipeline by stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageBreakdown.size === 0 ? (
              <p className="text-sm text-muted-foreground">No open opportunities.</p>
            ) : (
              [...stageBreakdown.entries()].map(([stage, { count, value }]) => (
                <div key={stage} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{stage}</Badge>
                    <span className="text-muted-foreground">
                      {count} deal{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              openTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="truncate">{entityDisplayName(task, "$title")}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(dueAt(task)) || "No due date"}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Recent notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              notes.data.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block text-sm hover:underline"
                >
                  <span className="font-medium">{entityDisplayName(note, "$title")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatRelative(note.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
