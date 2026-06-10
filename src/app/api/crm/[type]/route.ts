import { NextResponse } from "next/server";

import {
  entityWriteSchema,
  handleCrmError,
  parseListParams,
  parseObjectType,
  requireSession,
} from "@/lib/api-helpers";
import { getCrmSource } from "@/lib/lightfield";

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { type } = await context.params;
  const objectType = parseObjectType(type);
  if (!objectType) return NextResponse.json({ error: `Unknown object type: ${type}` }, { status: 404 });

  try {
    const params = parseListParams(new URL(request.url));
    const result = await getCrmSource().list(objectType, params);
    return NextResponse.json(result);
  } catch (error) {
    return handleCrmError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { type } = await context.params;
  const objectType = parseObjectType(type);
  if (!objectType) return NextResponse.json({ error: `Unknown object type: ${type}` }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = entityWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const created = await getCrmSource().create(objectType, parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleCrmError(error);
  }
}
