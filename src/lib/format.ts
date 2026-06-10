import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

import type { CrmEntity, FieldDefinition, FieldValue } from "@/lib/lightfield/types";

/** Resolve a SINGLE_SELECT/MULTI_SELECT raw value (option id or label) to its label. */
export function resolveOptionLabel(value: unknown, definition?: FieldDefinition): string {
  const options = definition?.typeConfiguration?.options ?? [];
  const match = options.find((option) => option.id === value || option.label === value);
  return match?.label ?? String(value ?? "");
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string") return "";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "MMM d, yyyy");
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export function formatCurrency(value: unknown, currencyCode = "USD"): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value ?? "");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFullName(value: unknown): string {
  if (value && typeof value === "object") {
    const name = value as { firstName?: string | null; lastName?: string | null };
    return [name.firstName, name.lastName].filter(Boolean).join(" ");
  }
  return String(value ?? "");
}

function formatAddress(value: unknown): string {
  if (value && typeof value === "object") {
    const address = value as Record<string, unknown>;
    return ["street", "street2", "city", "state", "postalCode", "country"]
      .map((key) => address[key])
      .filter(Boolean)
      .join(", ");
  }
  return String(value ?? "");
}

/** Convert any field value into a human-readable string for tables and detail views. */
export function formatFieldValue(field: FieldValue | undefined, definition?: FieldDefinition): string {
  if (!field || field.value === null || field.value === undefined || field.value === "") return "";
  const { value, valueType } = field;

  switch (valueType) {
    case "DATETIME":
      return formatDateTime(value);
    case "CURRENCY":
      return formatCurrency(value, definition?.typeConfiguration?.currency ?? "USD");
    case "CHECKBOX":
      return value ? "Yes" : "No";
    case "SINGLE_SELECT":
      return resolveOptionLabel(value, definition);
    case "MULTI_SELECT":
      return (Array.isArray(value) ? value : [value])
        .map((entry) => resolveOptionLabel(entry, definition))
        .join(", ");
    case "FULL_NAME":
      return formatFullName(value);
    case "ADDRESS":
      return formatAddress(value);
    case "NUMBER":
      return Number.isFinite(Number(value)) ? new Intl.NumberFormat().format(Number(value)) : String(value);
    default:
      if (Array.isArray(value)) return value.map(String).join(", ");
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
  }
}

/** Best-effort display name for an entity. */
export function entityDisplayName(entity: CrmEntity, primaryField: string): string {
  const primary = entity.fields[primaryField];
  if (primary) {
    const formatted = formatFieldValue(primary);
    if (formatted) return formatted;
  }
  for (const candidate of ["$name", "$title", "$subject"]) {
    const field = entity.fields[candidate];
    if (field) {
      const formatted = formatFieldValue(field);
      if (formatted) return formatted;
    }
  }
  return entity.id;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
