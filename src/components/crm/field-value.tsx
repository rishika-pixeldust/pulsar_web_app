"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatFieldValue, resolveOptionLabel } from "@/lib/format";
import type { FieldDefinition, FieldValue as FieldValueType } from "@/lib/lightfield/types";

interface FieldValueProps {
  field?: FieldValueType;
  definition?: FieldDefinition;
}

/** Renders a CRM field value with type-aware formatting (links, badges, etc.). */
export function FieldValue({ field, definition }: FieldValueProps) {
  if (!field || field.value === null || field.value === undefined || field.value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (field.valueType) {
    case "URL": {
      const href = String(field.value);
      return (
        <a
          href={href.startsWith("http") ? href : `https://${href}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {href.replace(/^https?:\/\//, "")}
          <ExternalLink className="size-3" />
        </a>
      );
    }
    case "EMAIL": {
      const address = String(field.value);
      return (
        <a
          href={`mailto:${address}`}
          className="text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {address}
        </a>
      );
    }
    case "SINGLE_SELECT":
      return <Badge variant="secondary">{resolveOptionLabel(field.value, definition)}</Badge>;
    case "MULTI_SELECT": {
      const values = Array.isArray(field.value) ? field.value : [field.value];
      return (
        <span className="flex flex-wrap gap-1">
          {values.map((value, index) => (
            <Badge key={index} variant="secondary">
              {resolveOptionLabel(value, definition)}
            </Badge>
          ))}
        </span>
      );
    }
    case "MARKDOWN":
    case "HTML":
      return (
        <span className="line-clamp-2 whitespace-pre-line text-muted-foreground">
          {formatFieldValue(field, definition)}
        </span>
      );
    default:
      return <span>{formatFieldValue(field, definition)}</span>;
  }
}
