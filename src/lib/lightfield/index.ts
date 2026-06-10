import "server-only";

import { createMockSource } from "./mock-source";
import { createSdkSource } from "./sdk-source";
import type { CrmDataSource } from "./types";

let cachedSource: CrmDataSource | null = null;

/** True when the portal is serving sample data instead of the live Lightfield API. */
export function isMockMode(): boolean {
  return !process.env.LIGHTFIELD_API_KEY;
}

/**
 * Returns the CRM data source: the Lightfield SDK when LIGHTFIELD_API_KEY is
 * set, otherwise an in-memory mock so the portal stays fully usable.
 */
export function getCrmSource(): CrmDataSource {
  if (cachedSource) return cachedSource;
  const apiKey = process.env.LIGHTFIELD_API_KEY;
  cachedSource = apiKey ? createSdkSource(apiKey) : createMockSource();
  return cachedSource;
}

export * from "./types";
export * from "./objects";
