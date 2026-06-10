"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEntity, useDefinitions, useUpdateEntity } from "@/hooks/use-crm";
import type { CrmEntity, CrmObjectType, FieldDefinition } from "@/lib/lightfield/types";

interface EntityFormDialogProps {
  type: CrmObjectType;
  /** When provided the dialog edits this record, otherwise it creates a new one. */
  entity?: CrmEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

const EDITABLE_TYPES = new Set([
  "TEXT",
  "EMAIL",
  "URL",
  "TELEPHONE",
  "NUMBER",
  "CURRENCY",
  "DATETIME",
  "SINGLE_SELECT",
  "CHECKBOX",
  "MARKDOWN",
  "SOCIAL_HANDLE",
]);

function initialValue(entity: CrmEntity | undefined, key: string, definition: FieldDefinition): string {
  const raw = entity?.fields[key]?.value;
  if (raw === null || raw === undefined) return "";
  if (definition.valueType === "DATETIME" && typeof raw === "string") {
    return raw.slice(0, 10);
  }
  if (typeof raw === "object") return "";
  return String(raw);
}

/**
 * Schema-driven create/edit dialog. Fields are rendered from the object's
 * Lightfield definitions, so custom fields work automatically.
 */
export function EntityFormDialog({ type, entity, open, onOpenChange, title }: EntityFormDialogProps) {
  const { data: definitions, isLoading: isLoadingDefinitions } = useDefinitions(type);
  const createMutation = useCreateEntity(type);
  const updateMutation = useUpdateEntity(type);
  const [values, setValues] = useState<Record<string, string>>({});

  const editableFields = useMemo(() => {
    if (!definitions) return [];
    return Object.entries(definitions.fieldDefinitions)
      .filter(([, definition]) => !definition.readOnly && EDITABLE_TYPES.has(definition.valueType))
      .sort(([a], [b]) => {
        // Keep name/title fields first for a natural form order.
        const rank = (key: string) => (key === "$name" || key === "$title" ? 0 : 1);
        return rank(a) - rank(b) || a.localeCompare(b);
      });
  }, [definitions]);

  const isEditing = Boolean(entity);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function getValue(key: string, definition: FieldDefinition): string {
    return values[key] ?? initialValue(entity, key, definition);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fields: Record<string, unknown> = {};
    for (const [key, definition] of editableFields) {
      const raw = getValue(key, definition);
      const isDirty = key in values;
      if (!isEditing && raw === "") continue;
      if (isEditing && !isDirty) continue;

      switch (definition.valueType) {
        case "NUMBER":
        case "CURRENCY":
          fields[key] = raw === "" ? null : Number(raw);
          break;
        case "CHECKBOX":
          fields[key] = raw === "true";
          break;
        case "DATETIME":
          fields[key] = raw === "" ? null : new Date(raw).toISOString();
          break;
        default:
          fields[key] = raw === "" ? null : raw;
      }
    }

    if (Object.keys(fields).length === 0) {
      onOpenChange(false);
      return;
    }

    try {
      if (isEditing && entity) {
        await updateMutation.mutateAsync({ id: entity.id, body: { fields } });
        toast.success("Record updated");
      } else {
        await createMutation.mutateAsync({ fields });
        toast.success("Record created");
      }
      setValues({});
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  function renderInput(key: string, definition: FieldDefinition) {
    const value = getValue(key, definition);
    const setValue = (next: string) => setValues((prev) => ({ ...prev, [key]: next }));

    switch (definition.valueType) {
      case "SINGLE_SELECT": {
        const options = definition.typeConfiguration?.options ?? [];
        return (
          <Select value={value || undefined} onValueChange={setValue}>
            <SelectTrigger id={key} className="w-full">
              <SelectValue placeholder={`Select ${definition.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "CHECKBOX":
        return (
          <Select value={value || undefined} onValueChange={setValue}>
            <SelectTrigger id={key} className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case "MARKDOWN":
        return (
          <Textarea
            id={key}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={4}
            placeholder={definition.description ?? ""}
          />
        );
      case "DATETIME":
        return <Input id={key} type="date" value={value} onChange={(event) => setValue(event.target.value)} />;
      case "NUMBER":
      case "CURRENCY":
        return (
          <Input
            id={key}
            type="number"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={definition.typeConfiguration?.currency ?? ""}
          />
        );
      default:
        return (
          <Input
            id={key}
            type={definition.valueType === "EMAIL" ? "email" : "text"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={definition.description ?? ""}
          />
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title ?? (isEditing ? "Edit record" : "New record")}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the fields below." : "Fill in the fields below to create a record."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDefinitions ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading form…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {editableFields.map(([key, definition]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{definition.label}</Label>
                {renderInput(key, definition)}
              </div>
            ))}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
