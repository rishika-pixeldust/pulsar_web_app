import Lightfield from "lightfield";
import {
  CrmDataSource,
  CrmEntity,
  CrmError,
  CrmListResponse,
  CrmObjectType,
  EntityWriteBody,
  ListQueryParams,
  MAX_PAGE_SIZE,
  ObjectDefinitions,
} from "./types";

interface SdkResource {
  list(query?: unknown, options?: unknown): Promise<unknown>;
  retrieve(id: string, options?: unknown): Promise<unknown>;
  create?(body: unknown, options?: unknown): Promise<unknown>;
  update?(id: string, body: unknown, options?: unknown): Promise<unknown>;
  definitions?(options?: unknown): Promise<unknown>;
}

function toQuery(params?: ListQueryParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    limit: Math.min(params?.limit ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE),
    offset: params?.offset ?? 0,
  };
  for (const [key, value] of Object.entries(params?.filters ?? {})) {
    if (value !== "") query[key] = value;
  }
  return query;
}

function asEntity(raw: unknown): CrmEntity {
  const record = raw as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    createdAt: (record.createdAt as string | null) ?? null,
    updatedAt: (record.updatedAt as string | null) ?? null,
    externalId: (record.externalId as string | null) ?? null,
    httpLink: (record.httpLink as string | null) ?? null,
    fields: (record.fields as CrmEntity["fields"]) ?? {},
    relationships: (record.relationships as CrmEntity["relationships"]) ?? {},
  };
}

function asListResponse(raw: unknown): CrmListResponse {
  const record = raw as { data?: unknown[]; totalCount?: number };
  return {
    data: (record.data ?? []).map(asEntity),
    totalCount: record.totalCount ?? record.data?.length ?? 0,
  };
}

function translateError(error: unknown): never {
  if (error instanceof Lightfield.APIError) {
    throw new CrmError(error.message, typeof error.status === "number" ? error.status : 502);
  }
  throw error;
}

/**
 * CrmDataSource backed by the official Lightfield TypeScript SDK.
 * Emails are fetched via the raw HTTP client since the current SDK
 * version does not yet expose an email resource.
 */
export function createSdkSource(apiKey: string): CrmDataSource {
  const client = new Lightfield({ apiKey });

  const resources: Partial<Record<CrmObjectType, SdkResource>> = {
    account: client.account as unknown as SdkResource,
    contact: client.contact as unknown as SdkResource,
    opportunity: client.opportunity as unknown as SdkResource,
    task: client.task as unknown as SdkResource,
    note: client.note as unknown as SdkResource,
    meeting: client.meeting as unknown as SdkResource,
    list: client.list as unknown as SdkResource,
    member: client.member as unknown as SdkResource,
  };

  async function listEmails(params?: ListQueryParams): Promise<CrmListResponse> {
    const raw = await client.get<unknown>("/v1/emails", { query: toQuery(params) });
    return asListResponse(raw);
  }

  async function deriveDefinitions(type: CrmObjectType): Promise<ObjectDefinitions> {
    // Types without a /definitions endpoint: infer a minimal schema from a sample record.
    const sample = await source.list(type, { limit: 1 });
    const fieldDefinitions: ObjectDefinitions["fieldDefinitions"] = {};
    const relationshipDefinitions: ObjectDefinitions["relationshipDefinitions"] = {};
    const first = sample.data[0];
    if (first) {
      for (const [key, field] of Object.entries(first.fields)) {
        fieldDefinitions[key] = {
          label: humanize(key),
          valueType: field.valueType,
        };
      }
      for (const [key, rel] of Object.entries(first.relationships)) {
        relationshipDefinitions[key] = {
          label: humanize(key),
          cardinality: rel.cardinality === "has_many" ? "HAS_MANY" : "HAS_ONE",
          objectType: rel.objectType,
        };
      }
    }
    return { objectType: type, fieldDefinitions, relationshipDefinitions };
  }

  const source: CrmDataSource = {
    async list(type, params) {
      try {
        if (type === "email") return await listEmails(params);
        const resource = requireResource(resources, type);
        const raw = await resource.list(toQuery(params));
        return asListResponse(raw);
      } catch (error) {
        translateError(error);
      }
    },

    async retrieve(type, id) {
      try {
        if (type === "email") {
          const raw = await client.get<unknown>(`/v1/emails/${id}`);
          return asEntity(raw);
        }
        const resource = requireResource(resources, type);
        return asEntity(await resource.retrieve(id));
      } catch (error) {
        translateError(error);
      }
    },

    async create(type, body) {
      try {
        const resource = requireResource(resources, type);
        if (!resource.create) throw new CrmError(`${type} records cannot be created`, 405);
        return asEntity(await resource.create(body as EntityWriteBody));
      } catch (error) {
        translateError(error);
      }
    },

    async update(type, id, body) {
      try {
        const resource = requireResource(resources, type);
        if (!resource.update) throw new CrmError(`${type} records cannot be updated`, 405);
        return asEntity(await resource.update(id, body as EntityWriteBody));
      } catch (error) {
        translateError(error);
      }
    },

    async definitions(type) {
      try {
        const resource = resources[type];
        if (resource?.definitions) {
          return (await resource.definitions()) as ObjectDefinitions;
        }
        return await deriveDefinitions(type);
      } catch (error) {
        translateError(error);
      }
    },

    async listMembers(listId, objectType, params) {
      try {
        const method =
          objectType === "account"
            ? client.list.listAccounts.bind(client.list)
            : objectType === "contact"
              ? client.list.listContacts.bind(client.list)
              : client.list.listOpportunities.bind(client.list);
        const raw = await method(listId, toQuery(params));
        return asListResponse(raw);
      } catch (error) {
        translateError(error);
      }
    },
  };

  return source;
}

function requireResource(
  resources: Partial<Record<CrmObjectType, SdkResource>>,
  type: CrmObjectType,
): SdkResource {
  const resource = resources[type];
  if (!resource) throw new CrmError(`Unsupported object type: ${type}`, 400);
  return resource;
}

function humanize(key: string): string {
  return key
    .replace(/^\$/, "")
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}
