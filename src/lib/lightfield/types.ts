/**
 * Shared types for the Lightfield CRM data layer.
 * Mirrors the shapes documented at https://docs.lightfield.app/
 */

export type ValueType =
  | "ADDRESS"
  | "CHECKBOX"
  | "CURRENCY"
  | "DATETIME"
  | "EMAIL"
  | "FULL_NAME"
  | "HTML"
  | "MARKDOWN"
  | "MULTI_SELECT"
  | "NUMBER"
  | "SINGLE_SELECT"
  | "SOCIAL_HANDLE"
  | "TELEPHONE"
  | "TEXT"
  | "URL";

export interface FieldValue {
  value: unknown;
  valueType: ValueType | string;
}

export interface EntityRelationship {
  cardinality: "has_one" | "has_many" | string;
  objectType: string;
  values: string[];
}

export interface CrmEntity {
  id: string;
  createdAt: string | null;
  updatedAt?: string | null;
  externalId?: string | null;
  httpLink?: string | null;
  fields: Record<string, FieldValue>;
  relationships: Record<string, EntityRelationship>;
}

export interface CrmListResponse {
  data: CrmEntity[];
  totalCount: number;
}

export interface SelectOption {
  id: string;
  label: string;
  description?: string | null;
}

export interface FieldDefinition {
  label: string;
  description?: string | null;
  valueType: ValueType | string;
  readOnly?: boolean;
  typeConfiguration?: {
    currency?: string;
    multipleValues?: boolean;
    options?: SelectOption[];
    unique?: boolean;
    handleService?: string;
  };
}

export interface RelationshipDefinition {
  label: string;
  description?: string | null;
  cardinality: "HAS_ONE" | "HAS_MANY" | string;
  objectType: string;
}

export interface ObjectDefinitions {
  objectType: string;
  fieldDefinitions: Record<string, FieldDefinition>;
  relationshipDefinitions: Record<string, RelationshipDefinition>;
}

export const CRM_OBJECT_TYPES = [
  "account",
  "contact",
  "opportunity",
  "task",
  "note",
  "meeting",
  "email",
  "list",
  "member",
] as const;

export type CrmObjectType = (typeof CRM_OBJECT_TYPES)[number];

export function isCrmObjectType(value: string): value is CrmObjectType {
  return (CRM_OBJECT_TYPES as readonly string[]).includes(value);
}

export interface ListQueryParams {
  limit?: number;
  offset?: number;
  /** Raw filter query params, e.g. { "$name[startsWith]": "Acme" } */
  filters?: Record<string, string>;
}

export interface EntityWriteBody {
  fields?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
}

/**
 * Uniform interface implemented by both the real Lightfield SDK source
 * and the in-memory mock source.
 */
export interface CrmDataSource {
  list(type: CrmObjectType, params?: ListQueryParams): Promise<CrmListResponse>;
  retrieve(type: CrmObjectType, id: string): Promise<CrmEntity>;
  create(type: CrmObjectType, body: EntityWriteBody): Promise<CrmEntity>;
  update(type: CrmObjectType, id: string, body: EntityWriteBody): Promise<CrmEntity>;
  definitions(type: CrmObjectType): Promise<ObjectDefinitions>;
  listMembers(
    listId: string,
    objectType: "account" | "contact" | "opportunity",
    params?: ListQueryParams,
  ): Promise<CrmListResponse>;
}

/** Max page size allowed by the Lightfield API. */
export const MAX_PAGE_SIZE = 25;

export class CrmError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "CrmError";
  }
}
