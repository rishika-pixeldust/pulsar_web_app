/**
 * Seeds the connected Lightfield workspace with demo data for every portal feature.
 *
 * Run with: npx tsx --env-file=.env.local scripts/seed-demo.ts
 *
 * Idempotent: records are looked up by name/title before creation, so re-running
 * the script will not create duplicates.
 */
import Lightfield from "lightfield";

const apiKey = process.env.LIGHTFIELD_API_KEY;
if (!apiKey) {
  console.error("LIGHTFIELD_API_KEY is not set. Run with: npx tsx --env-file=.env.local scripts/seed-demo.ts");
  process.exit(1);
}

const client = new Lightfield({ apiKey });

interface Definitions {
  fieldDefinitions: Record<
    string,
    {
      label: string;
      valueType: string;
      readOnly?: boolean;
      typeConfiguration?: { options?: { id: string; label: string }[]; multipleValues?: boolean };
    }
  >;
  relationshipDefinitions: Record<
    string,
    { label: string; objectType: string; cardinality: string }
  >;
}

const day = 86_400_000;
const ahead = (days: number, hour = 10) => {
  const date = new Date(Date.now() + days * day);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

/** Pick a select option id whose label matches the regex (falls back to first option). */
function pickOption(defs: Definitions, fieldKey: string, pattern: RegExp): string | undefined {
  const options = defs.fieldDefinitions[fieldKey]?.typeConfiguration?.options ?? [];
  return (options.find((option) => pattern.test(option.label)) ?? options[0])?.id;
}

/** Find the relationship slug pointing at a given object type (objectType may be `$`-prefixed). */
function relKey(defs: Definitions, objectType: string, preferred?: string): string | undefined {
  if (preferred && defs.relationshipDefinitions[preferred]) return preferred;
  return Object.entries(defs.relationshipDefinitions).find(
    ([, def]) => def.objectType.replace(/^\$/, "") === objectType,
  )?.[0];
}

/** Wrap a field value in an array when the schema says it accepts multiple values. */
function wrap(defs: Definitions, key: string, value: unknown): unknown {
  if (defs.fieldDefinitions[key]?.typeConfiguration?.multipleValues) {
    return Array.isArray(value) ? value : [value];
  }
  return Array.isArray(value) ? value[0] : value;
}

/** Keep only fields/relationships that exist (and are writable) in the live schema. */
function prune(
  defs: Definitions,
  fields: Record<string, unknown>,
  relationships: Record<string, unknown> = {},
) {
  const validFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    const def = defs.fieldDefinitions[key];
    if (def && !def.readOnly) validFields[key] = wrap(defs, key, value);
  }
  const validRels: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(relationships)) {
    if (value === undefined || value === null) continue;
    const def = defs.relationshipDefinitions[key];
    if (!def) continue;
    validRels[key] =
      def.cardinality === "HAS_MANY" && !Array.isArray(value) ? [value] : value;
  }
  return { fields: validFields, relationships: validRels };
}

function displayValue(value: unknown): string {
  if (value && typeof value === "object") {
    const name = value as { firstName?: string; lastName?: string };
    return [name.firstName, name.lastName].filter(Boolean).join(" ");
  }
  return String(value ?? "");
}

type Resource = {
  list(query?: unknown): Promise<{ data: { id: string; fields: Record<string, { value: unknown }> }[] }>;
  create(body: unknown): Promise<{ id: string }>;
};

async function findOrCreate(
  resource: Resource,
  label: string,
  nameField: string,
  nameValue: string,
  body: { fields: Record<string, unknown>; relationships?: Record<string, unknown> },
): Promise<string> {
  // Filtering on a field with no data yet returns a 400; fall back to a plain scan.
  const existing = await resource
    .list({ limit: 25, [`${nameField}[equal]`]: nameValue })
    .catch(() => resource.list({ limit: 25 }));
  const match = existing.data.find(
    (record) => displayValue(record.fields[nameField]?.value) === nameValue,
  );
  if (match) {
    console.log(`  = ${label}: "${nameValue}" already exists (${match.id})`);
    return match.id;
  }
  const created = await resource.create(body);
  console.log(`  + ${label}: "${nameValue}" (${created.id})`);
  return created.id;
}

async function main() {
  console.log("Fetching workspace schema…");
  const [accountDefs, contactDefs, opportunityDefs, taskDefs] = await Promise.all([
    client.account.definitions() as unknown as Promise<Definitions>,
    client.contact.definitions() as unknown as Promise<Definitions>,
    client.opportunity.definitions() as unknown as Promise<Definitions>,
    client.task.definitions() as unknown as Promise<Definitions>,
  ]);

  const members = await client.member.list({ limit: 1 });
  const ownerId = (members as unknown as { data: { id: string }[] }).data[0]?.id;
  console.log(`Owner member: ${ownerId ?? "none found"}`);

  // ---------- Accounts ----------
  console.log("\nAccounts:");
  const accountSeeds = [
    { name: "Northwind Traders", website: "https://northwindtraders.com", headcount: /^1001-5000$/, revenue: /50M to \$100M/ },
    { name: "Vertex Analytics", website: "https://vertexanalytics.io", headcount: /^51-100$/, revenue: /10M to \$50M/ },
    { name: "BlueRock Financial", website: "https://bluerockfin.com", headcount: /^1001-5000$/, revenue: /100M to \$500M/ },
    { name: "Helios Med Systems", website: "https://heliosmed.health", headcount: /^251-500$/, revenue: /10M to \$50M/ },
    { name: "Atlas Manufacturing Co", website: "https://atlasmfg.com", headcount: /^10001\+$/, revenue: /500M to \$1B/ },
  ];

  const accountIds: Record<string, string> = {};
  for (const seed of accountSeeds) {
    const { fields, relationships } = prune(
      accountDefs,
      {
        $name: seed.name,
        $website: seed.website,
        $headcount: pickOption(accountDefs, "$headcount", seed.headcount),
        $revenueRange: pickOption(accountDefs, "$revenueRange", seed.revenue),
        $linkedIn: `https://linkedin.com/company/${seed.name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      },
      { [relKey(accountDefs, "member", "$owner") ?? "$owner"]: ownerId },
    );
    accountIds[seed.name] = await findOrCreate(
      client.account as unknown as Resource,
      "account",
      "$name",
      seed.name,
      { fields, relationships },
    );
  }

  // ---------- Contacts ----------
  console.log("\nContacts:");
  const contactNameIsFullName = contactDefs.fieldDefinitions.$name?.valueType === "FULL_NAME";
  const contactSeeds = [
    { first: "Amelia", last: "Hart", email: "amelia.hart@northwindtraders.com", title: "VP of Operations", phone: "+14155550119", account: "Northwind Traders" },
    { first: "Diego", last: "Ramos", email: "diego.ramos@northwindtraders.com", title: "Director of IT", phone: "+14155550188", account: "Northwind Traders" },
    { first: "Priya", last: "Nair", email: "priya@vertexanalytics.io", title: "Chief Technology Officer", phone: "+12065550142", account: "Vertex Analytics" },
    { first: "Oliver", last: "Bennett", email: "o.bennett@bluerockfin.com", title: "Head of Procurement", phone: "+442079460823", account: "BlueRock Financial" },
    { first: "Sofia", last: "Marino", email: "s.marino@heliosmed.health", title: "Chief Operating Officer", phone: "+16175550177", account: "Helios Med Systems" },
    { first: "Ethan", last: "Walsh", email: "ethan.walsh@atlasmfg.com", title: "Plant Operations Manager", phone: "+13125550163", account: "Atlas Manufacturing Co" },
  ];

  const contactIds: Record<string, string> = {};
  for (const seed of contactSeeds) {
    const fullName = `${seed.first} ${seed.last}`;
    const { fields, relationships } = prune(
      contactDefs,
      {
        $name: contactNameIsFullName ? { firstName: seed.first, lastName: seed.last } : fullName,
        $email: seed.email,
        $title: seed.title,
        $phone: seed.phone,
      },
      { [relKey(contactDefs, "account", "$account") ?? "$account"]: accountIds[seed.account] },
    );
    // FULL_NAME fields must not be array-wrapped even if multipleValues is set.
    if (contactNameIsFullName) fields.$name = { firstName: seed.first, lastName: seed.last };
    contactIds[fullName] = await findOrCreate(
      client.contact as unknown as Resource,
      "contact",
      "$name",
      fullName,
      { fields, relationships },
    );
  }

  // ---------- Opportunities ----------
  console.log("\nOpportunities:");
  const opportunitySeeds = [
    { name: "Northwind — Enterprise Rollout", stage: /^proposal$/i, amount: 180_000, close: 21, account: "Northwind Traders", contact: "Amelia Hart", nextStep: "Final pricing sign-off with legal" },
    { name: "Vertex — Platform License", stage: /^trial$/i, amount: 95_000, close: 35, account: "Vertex Analytics", contact: "Priya Nair", nextStep: "Complete SSO scoping for rollout" },
    { name: "BlueRock — Compliance Suite", stage: /^demo$/i, amount: 220_000, close: 60, account: "BlueRock Financial", contact: "Oliver Bennett", nextStep: "Demo audit-trail features to compliance team" },
    { name: "Helios — Pilot Program", stage: /^qualification$/i, amount: 45_000, close: 75, account: "Helios Med Systems", contact: "Sofia Marino", nextStep: "Define pilot success criteria" },
    { name: "Atlas — Annual Contract", stage: /^won$/i, amount: 130_000, close: -10, account: "Atlas Manufacturing Co", contact: "Ethan Walsh", nextStep: "Kick off onboarding" },
  ];

  const opportunityIds: Record<string, string> = {};
  for (const seed of opportunitySeeds) {
    const { fields, relationships } = prune(
      opportunityDefs,
      {
        $name: seed.name,
        $stage: pickOption(opportunityDefs, "$stage", seed.stage),
        $amount: seed.amount,
        $closeDate: ahead(seed.close),
        $nextStep: seed.nextStep,
      },
      {
        [relKey(opportunityDefs, "account", "$account") ?? "$account"]: accountIds[seed.account],
        [relKey(opportunityDefs, "contact", "$champion") ?? "$champion"]: [contactIds[seed.contact]],
        [relKey(opportunityDefs, "member", "$owner") ?? "$owner"]: ownerId,
      },
    );
    opportunityIds[seed.name] = await findOrCreate(
      client.opportunity as unknown as Resource,
      "opportunity",
      "$name",
      seed.name,
      { fields, relationships },
    );
  }

  // ---------- Tasks ----------
  console.log("\nTasks:");
  const taskSeeds = [
    { title: "Send Northwind contract redlines", status: /in.?progress/i, due: 2, desc: "Incorporate legal feedback on the security addendum before sending.", account: "Northwind Traders", opportunity: "Northwind — Enterprise Rollout" },
    { title: "Prepare Vertex pricing comparison", status: /^todo$/i, due: 4, desc: "Side-by-side of usage-based vs flat tiers for Priya.", account: "Vertex Analytics", opportunity: "Vertex — Platform License" },
    { title: "Draft BlueRock discovery summary", status: /^todo$/i, due: 6, desc: "Summarize compliance requirements from the discovery call.", account: "BlueRock Financial", opportunity: "BlueRock — Compliance Suite" },
    { title: "Schedule Helios pilot kickoff", status: /^todo$/i, due: 8, desc: "Coordinate with Sofia's team on the pilot start date.", account: "Helios Med Systems", opportunity: "Helios — Pilot Program" },
    { title: "Log Atlas renewal win details", status: /complete/i, due: -3, desc: "Capture final pricing and term notes from the signed contract.", account: "Atlas Manufacturing Co", opportunity: "Atlas — Annual Contract" },
  ];

  for (const seed of taskSeeds) {
    const { fields, relationships } = prune(
      taskDefs,
      {
        $title: seed.title,
        $status: pickOption(taskDefs, "$status", seed.status),
        $dueAt: ahead(seed.due, 17),
        $description: seed.desc,
      },
      {
        [relKey(taskDefs, "account", "$account") ?? "$account"]: accountIds[seed.account],
        [relKey(taskDefs, "opportunity", "$opportunity") ?? "$opportunity"]: opportunityIds[seed.opportunity],
        [relKey(taskDefs, "member", "$assignedTo") ?? "$assignedTo"]: ownerId,
      },
    );
    await findOrCreate(client.task as unknown as Resource, "task", "$title", seed.title, {
      fields,
      relationships,
    });
  }

  // ---------- Notes ----------
  console.log("\nNotes:");
  const noteSeeds = [
    {
      title: "Northwind exec briefing — key takeaways",
      content:
        "## Summary\n\nMet with **Amelia Hart** and the ops leadership team.\n\n- Budget approved for the enterprise rollout\n- Security review is the main remaining blocker\n- Target signature: end of month",
      account: "Northwind Traders",
      opportunity: "Northwind — Enterprise Rollout",
    },
    {
      title: "Vertex technical evaluation notes",
      content:
        "Priya's team completed the POC. Key findings:\n\n- API latency well within target\n- Wants SSO before rollout\n- Pricing sensitivity on overage tiers",
      account: "Vertex Analytics",
      opportunity: "Vertex — Platform License",
    },
    {
      title: "BlueRock discovery call recap",
      content:
        "Oliver outlined compliance pain points across 3 regions. Phased rollout preferred. Emphasize audit-trail features and ROI within two quarters.",
      account: "BlueRock Financial",
      opportunity: "BlueRock — Compliance Suite",
    },
  ];

  const existingNotes = await client.note.list({ limit: 25 });
  for (const seed of noteSeeds) {
    const match = (existingNotes as unknown as { data: { id: string; fields: Record<string, { value: unknown }> }[] }).data.find(
      (record) => record.fields.$title?.value === seed.title,
    );
    if (match) {
      console.log(`  = note: "${seed.title}" already exists (${match.id})`);
      continue;
    }
    const created = await client.note.create({
      fields: { $title: seed.title, $content: seed.content },
      relationships: {
        $account: accountIds[seed.account],
        $opportunity: opportunityIds[seed.opportunity],
      },
    });
    console.log(`  + note: "${seed.title}" (${created.id})`);
  }

  // ---------- Meetings ----------
  console.log("\nMeetings:");
  // The API only accepts meetings with a start date in the past (logged events).
  const meetingSeeds = [
    { title: "Northwind — contract review call", start: -2, desc: "Walked through MSA redlines with legal on both sides.", emails: ["amelia.hart@northwindtraders.com"] },
    { title: "Vertex — SSO implementation sync", start: -5, desc: "Scoped SSO requirements ahead of platform rollout.", emails: ["priya@vertexanalytics.io"] },
    { title: "Helios — discovery workshop", start: -9, desc: "Mapped pilot goals with the operations team.", emails: ["s.marino@heliosmed.health"] },
  ];

  const existingMeetings = await client.meeting.list({ limit: 25 });
  for (const seed of meetingSeeds) {
    const match = (existingMeetings as unknown as { data: { id: string; fields: Record<string, { value: unknown }> }[] }).data.find(
      (record) => record.fields.$title?.value === seed.title,
    );
    if (match) {
      console.log(`  = meeting: "${seed.title}" already exists (${match.id})`);
      continue;
    }
    const created = await client.meeting.create({
      fields: {
        $title: seed.title,
        $startDate: ahead(seed.start, 14),
        $endDate: ahead(seed.start, 15),
        $description: seed.desc,
        $attendeeEmails: seed.emails,
        $meetingUrl: "https://meet.google.com/demo-link",
      },
    });
    console.log(`  + meeting: "${seed.title}" (${created.id})`);
  }

  // ---------- Lists ----------
  console.log("\nLists:");
  const listSeeds = [
    {
      name: "Q3 Target Accounts",
      objectType: "account" as const,
      relationships: { $accounts: ["Northwind Traders", "BlueRock Financial", "Atlas Manufacturing Co"].map((n) => accountIds[n]) },
    },
    {
      name: "Champions",
      objectType: "contact" as const,
      relationships: { $contacts: ["Amelia Hart", "Priya Nair"].map((n) => contactIds[n]) },
    },
  ];

  const existingLists = await client.list.list({ limit: 25 });
  for (const seed of listSeeds) {
    const match = (existingLists as unknown as { data: { id: string; fields: Record<string, { value: unknown }> }[] }).data.find(
      (record) => record.fields.$name?.value === seed.name,
    );
    if (match) {
      console.log(`  = list: "${seed.name}" already exists (${match.id})`);
      continue;
    }
    const created = await client.list.create({
      fields: { $name: seed.name, $objectType: seed.objectType },
      relationships: seed.relationships as never,
    });
    console.log(`  + list: "${seed.name}" (${created.id})`);
  }

  console.log("\nDone. Emails cannot be seeded via the API (they sync from a connected mailbox).");
}

main().catch((error) => {
  console.error("\nSeed failed:", error?.message ?? error);
  if (error?.status) console.error("HTTP status:", error.status);
  process.exit(1);
});
