import { NextResponse } from "next/server";

import { handleCrmError, parseObjectType, requireSession } from "@/lib/api-helpers";
import { getCrmSource } from "@/lib/lightfield";

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const { type } = await context.params;
  const objectType = parseObjectType(type);
  if (!objectType) return NextResponse.json({ error: `Unknown object type: ${type}` }, { status: 404 });

  try {
    const definitions = await getCrmSource().definitions(objectType);
    return NextResponse.json(definitions);
  } catch (error) {
    return handleCrmError(error);
  }
}
