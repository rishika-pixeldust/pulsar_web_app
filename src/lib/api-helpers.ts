import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { CrmError, isCrmObjectType, type CrmObjectType, type ListQueryParams } from "@/lib/lightfield";

export const entityWriteSchema = z.object({
  fields: z.record(z.string(), z.unknown()).optional(),
  relationships: z.record(z.string(), z.unknown()).optional(),
});

export async function requireSession(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function parseObjectType(slug: string): CrmObjectType | null {
  return isCrmObjectType(slug) ? slug : null;
}

export function parseListParams(url: URL): ListQueryParams {
  const limit = Number(url.searchParams.get("limit") ?? 25);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const filters: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "limit" || key === "offset") continue;
    filters[key] = value;
  }
  return {
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
    filters,
  };
}

export function handleCrmError(error: unknown): NextResponse {
  if (error instanceof CrmError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unexpected CRM error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
