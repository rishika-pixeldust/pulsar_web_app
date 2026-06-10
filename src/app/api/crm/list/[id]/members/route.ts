import { NextResponse } from "next/server";

import { handleCrmError, parseListParams, requireSession } from "@/lib/api-helpers";
import { getCrmSource } from "@/lib/lightfield";

type RouteContext = { params: Promise<{ id: string }> };

const MEMBER_TYPES = ["account", "contact", "opportunity"] as const;
type MemberType = (typeof MEMBER_TYPES)[number];

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const url = new URL(request.url);
  const objectType = url.searchParams.get("objectType") ?? "account";
  if (!MEMBER_TYPES.includes(objectType as MemberType)) {
    return NextResponse.json({ error: `Invalid list member type: ${objectType}` }, { status: 400 });
  }

  try {
    const params = parseListParams(url);
    delete params.filters?.objectType;
    const result = await getCrmSource().listMembers(id, objectType as MemberType, params);
    return NextResponse.json(result);
  } catch (error) {
    return handleCrmError(error);
  }
}
