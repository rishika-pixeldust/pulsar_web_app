import { NextResponse } from "next/server";

import {
  entityWriteSchema,
  handleCrmError,
  parseObjectType,
  requireSession,
} from "@/lib/api-helpers";
import { getCrmSource } from "@/lib/lightfield";

type RouteContext = { params: Promise<{ type: string; id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { type, id } = await context.params;
  const objectType = parseObjectType(type);
  if (!objectType) return NextResponse.json({ error: `Unknown object type: ${type}` }, { status: 404 });

  try {
    const entity = await getCrmSource().retrieve(objectType, id);
    return NextResponse.json(entity);
  } catch (error) {
    return handleCrmError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { type, id } = await context.params;
  const objectType = parseObjectType(type);
  if (!objectType) return NextResponse.json({ error: `Unknown object type: ${type}` }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = entityWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await getCrmSource().update(objectType, id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    return handleCrmError(error);
  }
}
