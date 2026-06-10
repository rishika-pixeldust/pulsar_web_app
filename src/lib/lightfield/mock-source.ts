import { buildMockStore, MOCK_DEFINITIONS } from "./mock-data";
import {
  CrmDataSource,
  CrmEntity,
  CrmError,
  CrmListResponse,
  CrmObjectType,
  EntityWriteBody,
  FieldValue,
  ListQueryParams,
  MAX_PAGE_SIZE,
  ObjectDefinitions,
} from "./types";

type MockStore = Record<CrmObjectType, CrmEntity[]>;

// Keep the mock store stable across Next.js dev-server hot reloads.
const globalForMock = globalThis as unknown as { __crmMockStore?: MockStore };

function getStore(): MockStore {
  globalForMock.__crmMockStore ??= buildMockStore();
  return globalForMock.__crmMockStore;
}

function inferValueType(type: CrmObjectType, key: string, value: unknown): string {
  const definition = MOCK_DEFINITIONS[type]?.fieldDefinitions[key];
  if (definition) return definition.valueType;
  if (typeof value === "number") return "NUMBER";
  if (typeof value === "boolean") return "CHECKBOX";
  return "TEXT";
}

function toFields(type: CrmObjectType, fields: Record<string, unknown>): Record<string, FieldValue> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      { value, valueType: inferValueType(type, key, value) },
    ]),
  );
}

function toRelationships(
  type: CrmObjectType,
  relationships: Record<string, unknown>,
): CrmEntity["relationships"] {
  const definitions = MOCK_DEFINITIONS[type]?.relationshipDefinitions ?? {};
  return Object.fromEntries(
    Object.entries(relationships).map(([key, value]) => {
      const definition = definitions[key];
      const values = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
      return [
        key,
        {
          cardinality: definition?.cardinality === "HAS_MANY" ? "has_many" : "has_one",
          objectType: definition?.objectType ?? "account",
          values,
        },
      ];
    }),
  );
}

function matchesFilter(entity: CrmEntity, key: string, rawValue: string): boolean {
  const match = key.match(/^(.+?)(?:\[(-?\w+)\])?$/);
  if (!match) return true;
  const [, fieldKey, operator = "contains"] = match;

  const relationship = entity.relationships[fieldKey];
  if (relationship) return relationship.values.includes(rawValue);

  // Relationship-definition slugs (e.g. $account-contact) don't match response
  // keys directly in mock mode; fall back to scanning all relationships.
  if (fieldKey.includes("-")) {
    return Object.values(entity.relationships).some((rel) => rel.values.includes(rawValue));
  }

  const field = entity.fields[fieldKey];
  if (!field) return false;
  const value = String(field.value ?? "").toLowerCase();
  const target = rawValue.toLowerCase();

  const negated = operator.startsWith("-");
  const op = negated ? operator.slice(1) : operator;
  let result: boolean;
  switch (op) {
    case "equal":
    case "equals":
      result = value === target;
      break;
    case "startsWith":
      result = value.startsWith(target);
      break;
    case "greaterThan":
      result = Number(field.value) > Number(rawValue);
      break;
    case "greaterThanOrEqual":
      result = Number(field.value) >= Number(rawValue);
      break;
    case "lessThan":
      result = Number(field.value) < Number(rawValue);
      break;
    case "lessThanOrEqual":
      result = Number(field.value) <= Number(rawValue);
      break;
    default:
      result = value.includes(target);
  }
  return negated ? !result : result;
}

function applyParams(records: CrmEntity[], params?: ListQueryParams): CrmListResponse {
  let filtered = records;
  for (const [key, value] of Object.entries(params?.filters ?? {})) {
    if (value === "") continue;
    filtered = filtered.filter((record) => matchesFilter(record, key, value));
  }
  const offset = params?.offset ?? 0;
  const limit = Math.min(params?.limit ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
  return { data: filtered.slice(offset, offset + limit), totalCount: filtered.length };
}

let idCounter = 0;
function nextId(type: CrmObjectType): string {
  idCounter += 1;
  return `${type.slice(0, 3)}_mock_${Date.now().toString(36)}${idCounter}`;
}

/** In-memory CrmDataSource used when no API key is configured. */
export function createMockSource(): CrmDataSource {
  return {
    async list(type, params) {
      return applyParams(getStore()[type] ?? [], params);
    },

    async retrieve(type, id) {
      const record = (getStore()[type] ?? []).find((entry) => entry.id === id);
      if (!record) throw new CrmError(`${type} ${id} not found`, 404);
      return record;
    },

    async create(type, body: EntityWriteBody) {
      const record: CrmEntity = {
        id: nextId(type),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        externalId: null,
        httpLink: null,
        fields: toFields(type, body.fields ?? {}),
        relationships: toRelationships(type, body.relationships ?? {}),
      };
      getStore()[type].unshift(record);
      return record;
    },

    async update(type, id, body: EntityWriteBody) {
      const record = await this.retrieve(type, id);
      Object.assign(record.fields, toFields(type, body.fields ?? {}));
      Object.assign(record.relationships, toRelationships(type, body.relationships ?? {}));
      record.updatedAt = new Date().toISOString();
      return record;
    },

    async definitions(type) {
      const known = MOCK_DEFINITIONS[type];
      if (known) return known;
      const sample = getStore()[type]?.[0];
      const derived: ObjectDefinitions = {
        objectType: type,
        fieldDefinitions: {},
        relationshipDefinitions: {},
      };
      if (sample) {
        for (const [key, field] of Object.entries(sample.fields)) {
          derived.fieldDefinitions[key] = {
            label: key.replace(/^\$/, "").replace(/([a-z])([A-Z])/g, "$1 $2"),
            valueType: field.valueType,
          };
        }
        for (const [key, rel] of Object.entries(sample.relationships)) {
          derived.relationshipDefinitions[key] = {
            label: key.replace(/^\$/, ""),
            cardinality: rel.cardinality === "has_many" ? "HAS_MANY" : "HAS_ONE",
            objectType: rel.objectType,
          };
        }
      }
      return derived;
    },

    async listMembers(listId, objectType, params) {
      const list = (getStore().list ?? []).find((entry) => entry.id === listId);
      if (!list) throw new CrmError(`list ${listId} not found`, 404);
      const ids = new Set(
        Object.values(list.relationships)
          .filter((rel) => rel.objectType === objectType)
          .flatMap((rel) => rel.values),
      );
      const records = (getStore()[objectType] ?? []).filter((record) => ids.has(record.id));
      return applyParams(records, params);
    },
  };
}
