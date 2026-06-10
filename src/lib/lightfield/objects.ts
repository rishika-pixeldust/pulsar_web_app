import type { CrmObjectType } from "./types";

export interface CrmObjectConfig {
  /** Plural display label, e.g. "Accounts" */
  label: string;
  /** Singular display label, e.g. "Account" */
  singular: string;
  /** URL segment for the portal, e.g. "accounts" */
  slug: string;
  /** The field key used as the display name of a record */
  primaryField: string;
  /** Whether records can be created/edited from the portal */
  isWritable: boolean;
  /** Whether the API exposes a /definitions endpoint for this type */
  hasDefinitionsEndpoint: boolean;
  /** Field keys to prefer as table columns (rendered if present) */
  preferredColumns: string[];
}

export const CRM_OBJECTS: Record<CrmObjectType, CrmObjectConfig> = {
  account: {
    label: "Accounts",
    singular: "Account",
    slug: "accounts",
    primaryField: "$name",
    isWritable: true,
    hasDefinitionsEndpoint: true,
    preferredColumns: ["$name", "$website", "$industry", "$headcount"],
  },
  contact: {
    label: "Contacts",
    singular: "Contact",
    slug: "contacts",
    primaryField: "$name",
    isWritable: true,
    hasDefinitionsEndpoint: true,
    preferredColumns: ["$name", "$email", "$title", "$phone"],
  },
  opportunity: {
    label: "Opportunities",
    singular: "Opportunity",
    slug: "opportunities",
    primaryField: "$name",
    isWritable: true,
    hasDefinitionsEndpoint: true,
    preferredColumns: ["$name", "$stage", "$amount", "$closeDate"],
  },
  task: {
    label: "Tasks",
    singular: "Task",
    slug: "tasks",
    primaryField: "$title",
    isWritable: true,
    hasDefinitionsEndpoint: true,
    preferredColumns: ["$title", "$status", "$dueAt"],
  },
  note: {
    label: "Notes",
    singular: "Note",
    slug: "notes",
    primaryField: "$title",
    isWritable: true,
    hasDefinitionsEndpoint: false,
    preferredColumns: ["$title", "$content"],
  },
  meeting: {
    label: "Meetings",
    singular: "Meeting",
    slug: "meetings",
    primaryField: "$title",
    isWritable: false,
    hasDefinitionsEndpoint: false,
    preferredColumns: ["$title", "$startDate", "$meetingUrl"],
  },
  email: {
    label: "Emails",
    singular: "Email",
    slug: "emails",
    primaryField: "$subject",
    isWritable: false,
    hasDefinitionsEndpoint: false,
    preferredColumns: ["$subject", "$from", "$sentAt"],
  },
  list: {
    label: "Lists",
    singular: "List",
    slug: "lists",
    primaryField: "$name",
    isWritable: true,
    hasDefinitionsEndpoint: false,
    preferredColumns: ["$name", "$objectType"],
  },
  member: {
    label: "Members",
    singular: "Member",
    slug: "members",
    primaryField: "$name",
    isWritable: false,
    hasDefinitionsEndpoint: false,
    preferredColumns: ["$name", "$email", "$role"],
  },
};

export function objectTypeFromSlug(slug: string): CrmObjectType | null {
  const entry = Object.entries(CRM_OBJECTS).find(([, cfg]) => cfg.slug === slug);
  return (entry?.[0] as CrmObjectType) ?? null;
}
