import type { CrmEntity, CrmObjectType, ObjectDefinitions } from "./types";

/**
 * Realistic seed data used when no LIGHTFIELD_API_KEY is configured,
 * so the portal is fully explorable in "mock mode".
 */

const text = (value: unknown) => ({ value, valueType: "TEXT" });
const email = (value: unknown) => ({ value, valueType: "EMAIL" });
const url = (value: unknown) => ({ value, valueType: "URL" });
const phone = (value: unknown) => ({ value, valueType: "TELEPHONE" });
const num = (value: unknown) => ({ value, valueType: "NUMBER" });
const currency = (value: unknown) => ({ value, valueType: "CURRENCY" });
const date = (value: unknown) => ({ value, valueType: "DATETIME" });
const single = (value: unknown) => ({ value, valueType: "SINGLE_SELECT" });
const markdown = (value: unknown) => ({ value, valueType: "MARKDOWN" });

const hasOne = (objectType: string, id?: string) => ({
  cardinality: "has_one",
  objectType,
  values: id ? [id] : [],
});
const hasMany = (objectType: string, ids: string[]) => ({
  cardinality: "has_many",
  objectType,
  values: ids,
});

const STAGES = [
  { id: "opt_stage_qualification", label: "Qualification" },
  { id: "opt_stage_discovery", label: "Discovery" },
  { id: "opt_stage_proposal", label: "Proposal" },
  { id: "opt_stage_negotiation", label: "Negotiation" },
  { id: "opt_stage_closed_won", label: "Closed Won" },
  { id: "opt_stage_closed_lost", label: "Closed Lost" },
];

const TASK_STATUSES = [
  { id: "opt_status_todo", label: "To Do" },
  { id: "opt_status_in_progress", label: "In Progress" },
  { id: "opt_status_done", label: "Done" },
];

const INDUSTRIES = [
  { id: "opt_ind_saas", label: "SaaS" },
  { id: "opt_ind_fintech", label: "Fintech" },
  { id: "opt_ind_health", label: "Healthcare" },
  { id: "opt_ind_retail", label: "Retail" },
  { id: "opt_ind_manufacturing", label: "Manufacturing" },
];

export const MOCK_DEFINITIONS: Partial<Record<CrmObjectType, ObjectDefinitions>> = {
  account: {
    objectType: "account",
    fieldDefinitions: {
      $name: { label: "Name", valueType: "TEXT", description: "Account name" },
      $website: { label: "Website", valueType: "URL" },
      $industry: {
        label: "Industry",
        valueType: "SINGLE_SELECT",
        typeConfiguration: { options: INDUSTRIES },
      },
      $headcount: { label: "Headcount", valueType: "NUMBER" },
      $revenue: { label: "Annual Revenue", valueType: "CURRENCY", typeConfiguration: { currency: "USD" } },
      $linkedIn: { label: "LinkedIn", valueType: "URL" },
    },
    relationshipDefinitions: {
      $owner: { label: "Owner", cardinality: "HAS_ONE", objectType: "member" },
      $contact: { label: "Contacts", cardinality: "HAS_MANY", objectType: "contact" },
      $opportunity: { label: "Opportunities", cardinality: "HAS_MANY", objectType: "opportunity" },
    },
  },
  contact: {
    objectType: "contact",
    fieldDefinitions: {
      $name: { label: "Name", valueType: "TEXT" },
      $email: { label: "Email", valueType: "EMAIL" },
      $title: { label: "Job Title", valueType: "TEXT" },
      $phone: { label: "Phone", valueType: "TELEPHONE" },
      $linkedIn: { label: "LinkedIn", valueType: "URL" },
    },
    relationshipDefinitions: {
      $account: { label: "Account", cardinality: "HAS_ONE", objectType: "account" },
      $owner: { label: "Owner", cardinality: "HAS_ONE", objectType: "member" },
    },
  },
  opportunity: {
    objectType: "opportunity",
    fieldDefinitions: {
      $name: { label: "Name", valueType: "TEXT" },
      $stage: {
        label: "Stage",
        valueType: "SINGLE_SELECT",
        typeConfiguration: { options: STAGES },
      },
      $amount: { label: "Amount", valueType: "CURRENCY", typeConfiguration: { currency: "USD" } },
      $closeDate: { label: "Close Date", valueType: "DATETIME" },
      $nextSteps: { label: "Next Steps", valueType: "TEXT" },
    },
    relationshipDefinitions: {
      $account: { label: "Account", cardinality: "HAS_ONE", objectType: "account" },
      $contact: { label: "Contacts", cardinality: "HAS_MANY", objectType: "contact" },
      $owner: { label: "Owner", cardinality: "HAS_ONE", objectType: "member" },
    },
  },
  task: {
    objectType: "task",
    fieldDefinitions: {
      $title: { label: "Title", valueType: "TEXT" },
      $status: {
        label: "Status",
        valueType: "SINGLE_SELECT",
        typeConfiguration: { options: TASK_STATUSES },
      },
      $dueAt: { label: "Due Date", valueType: "DATETIME" },
      $description: { label: "Description", valueType: "MARKDOWN" },
    },
    relationshipDefinitions: {
      $owner: { label: "Owner", cardinality: "HAS_ONE", objectType: "member" },
      "$task-account": { label: "Account", cardinality: "HAS_ONE", objectType: "account" },
    },
  },
  note: {
    objectType: "note",
    fieldDefinitions: {
      $title: { label: "Title", valueType: "TEXT" },
      $content: { label: "Body", valueType: "MARKDOWN" },
    },
    relationshipDefinitions: {
      $account: { label: "Account", cardinality: "HAS_ONE", objectType: "account" },
      $opportunity: { label: "Opportunity", cardinality: "HAS_ONE", objectType: "opportunity" },
    },
  },
  list: {
    objectType: "list",
    fieldDefinitions: {
      $name: { label: "Name", valueType: "TEXT" },
      $objectType: {
        label: "Object Type",
        valueType: "SINGLE_SELECT",
        typeConfiguration: {
          options: [
            { id: "account", label: "Accounts" },
            { id: "contact", label: "Contacts" },
            { id: "opportunity", label: "Opportunities" },
          ],
        },
      },
    },
    relationshipDefinitions: {},
  },
};

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();
const daysAhead = (days: number) => new Date(now + days * 86_400_000).toISOString();

function entity(
  id: string,
  createdDaysAgo: number,
  fields: CrmEntity["fields"],
  relationships: CrmEntity["relationships"] = {},
): CrmEntity {
  return {
    id,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(createdDaysAgo - 2, 0)),
    externalId: null,
    httpLink: null,
    fields,
    relationships,
  };
}

export function buildMockStore(): Record<CrmObjectType, CrmEntity[]> {
  return {
    member: [
      entity("mem_riley", 200, {
        $name: text("Riley Chen"),
        $email: email("riley@yourco.com"),
        $role: text("Account Executive"),
      }),
      entity("mem_sam", 180, {
        $name: text("Sam Patel"),
        $email: email("sam@yourco.com"),
        $role: text("Sales Manager"),
      }),
    ],

    account: [
      entity(
        "acc_acme",
        90,
        {
          $name: text("Acme Corp"),
          $website: url("https://acme.com"),
          $industry: single("SaaS"),
          $headcount: num(1200),
          $revenue: currency(48_000_000),
          $linkedIn: url("https://linkedin.com/company/acme"),
        },
        {
          $owner: hasOne("member", "mem_riley"),
          $contact: hasMany("contact", ["con_jane", "con_mark"]),
          $opportunity: hasMany("opportunity", ["opp_acme_expansion"]),
        },
      ),
      entity(
        "acc_globex",
        70,
        {
          $name: text("Globex Industries"),
          $website: url("https://globex.io"),
          $industry: single("Manufacturing"),
          $headcount: num(5400),
          $revenue: currency(210_000_000),
        },
        {
          $owner: hasOne("member", "mem_sam"),
          $contact: hasMany("contact", ["con_lena"]),
          $opportunity: hasMany("opportunity", ["opp_globex_pilot"]),
        },
      ),
      entity(
        "acc_initech",
        45,
        {
          $name: text("Initech"),
          $website: url("https://initech.dev"),
          $industry: single("Fintech"),
          $headcount: num(310),
          $revenue: currency(12_500_000),
        },
        {
          $owner: hasOne("member", "mem_riley"),
          $contact: hasMany("contact", ["con_peter"]),
          $opportunity: hasMany("opportunity", ["opp_initech_platform", "opp_initech_renewal"]),
        },
      ),
      entity(
        "acc_umbrella",
        30,
        {
          $name: text("Umbrella Health"),
          $website: url("https://umbrellahealth.org"),
          $industry: single("Healthcare"),
          $headcount: num(880),
          $revenue: currency(64_000_000),
        },
        { $owner: hasOne("member", "mem_sam") },
      ),
      entity(
        "acc_stark",
        12,
        {
          $name: text("Stark Retail Group"),
          $website: url("https://starkretail.com"),
          $industry: single("Retail"),
          $headcount: num(2300),
          $revenue: currency(95_000_000),
        },
        { $owner: hasOne("member", "mem_riley") },
      ),
    ],

    contact: [
      entity(
        "con_jane",
        85,
        {
          $name: text("Jane Cooper"),
          $email: email("jane.cooper@acme.com"),
          $title: text("VP of Operations"),
          $phone: phone("+1 415 555 0134"),
          $linkedIn: url("https://linkedin.com/in/janecooper"),
        },
        { $account: hasOne("account", "acc_acme"), $owner: hasOne("member", "mem_riley") },
      ),
      entity(
        "con_mark",
        80,
        {
          $name: text("Mark Ito"),
          $email: email("mark.ito@acme.com"),
          $title: text("Director of IT"),
          $phone: phone("+1 415 555 0188"),
        },
        { $account: hasOne("account", "acc_acme"), $owner: hasOne("member", "mem_riley") },
      ),
      entity(
        "con_lena",
        66,
        {
          $name: text("Lena Fischer"),
          $email: email("l.fischer@globex.io"),
          $title: text("Chief Procurement Officer"),
          $phone: phone("+49 30 555 7721"),
        },
        { $account: hasOne("account", "acc_globex"), $owner: hasOne("member", "mem_sam") },
      ),
      entity(
        "con_peter",
        40,
        {
          $name: text("Peter Gibbons"),
          $email: email("peter@initech.dev"),
          $title: text("Head of Engineering"),
          $phone: phone("+1 512 555 042"),
        },
        { $account: hasOne("account", "acc_initech"), $owner: hasOne("member", "mem_riley") },
      ),
    ],

    opportunity: [
      entity(
        "opp_acme_expansion",
        60,
        {
          $name: text("Acme Corp — Enterprise Expansion"),
          $stage: single("Negotiation"),
          $amount: currency(180_000),
          $closeDate: date(daysAhead(20)),
          $nextSteps: text("Legal review of MSA; schedule exec sign-off call."),
        },
        {
          $account: hasOne("account", "acc_acme"),
          $contact: hasMany("contact", ["con_jane", "con_mark"]),
          $owner: hasOne("member", "mem_riley"),
        },
      ),
      entity(
        "opp_globex_pilot",
        50,
        {
          $name: text("Globex — Manufacturing Pilot"),
          $stage: single("Discovery"),
          $amount: currency(75_000),
          $closeDate: date(daysAhead(45)),
          $nextSteps: text("Deliver pilot success criteria document."),
        },
        {
          $account: hasOne("account", "acc_globex"),
          $contact: hasMany("contact", ["con_lena"]),
          $owner: hasOne("member", "mem_sam"),
        },
      ),
      entity(
        "opp_initech_platform",
        35,
        {
          $name: text("Initech — Platform License"),
          $stage: single("Proposal"),
          $amount: currency(120_000),
          $closeDate: date(daysAhead(30)),
          $nextSteps: text("Send revised proposal with usage-based pricing."),
        },
        {
          $account: hasOne("account", "acc_initech"),
          $contact: hasMany("contact", ["con_peter"]),
          $owner: hasOne("member", "mem_riley"),
        },
      ),
      entity(
        "opp_initech_renewal",
        25,
        {
          $name: text("Initech — Annual Renewal"),
          $stage: single("Qualification"),
          $amount: currency(45_000),
          $closeDate: date(daysAhead(75)),
        },
        {
          $account: hasOne("account", "acc_initech"),
          $owner: hasOne("member", "mem_riley"),
        },
      ),
      entity(
        "opp_umbrella_won",
        90,
        {
          $name: text("Umbrella Health — Initial Deal"),
          $stage: single("Closed Won"),
          $amount: currency(95_000),
          $closeDate: date(daysAgo(15)),
        },
        {
          $account: hasOne("account", "acc_umbrella"),
          $owner: hasOne("member", "mem_sam"),
        },
      ),
    ],

    task: [
      entity(
        "task_msa",
        10,
        {
          $title: text("Send MSA redlines to Acme legal"),
          $status: single("In Progress"),
          $dueAt: date(daysAhead(2)),
          $description: markdown("Incorporate security addendum feedback before sending."),
        },
        {
          $owner: hasOne("member", "mem_riley"),
          "$task-account": hasOne("account", "acc_acme"),
        },
      ),
      entity(
        "task_pilot_doc",
        8,
        {
          $title: text("Draft Globex pilot success criteria"),
          $status: single("To Do"),
          $dueAt: date(daysAhead(5)),
        },
        {
          $owner: hasOne("member", "mem_sam"),
          "$task-account": hasOne("account", "acc_globex"),
        },
      ),
      entity(
        "task_pricing",
        6,
        {
          $title: text("Revise Initech proposal pricing"),
          $status: single("To Do"),
          $dueAt: date(daysAhead(1)),
        },
        {
          $owner: hasOne("member", "mem_riley"),
          "$task-account": hasOne("account", "acc_initech"),
        },
      ),
      entity(
        "task_kickoff",
        20,
        {
          $title: text("Schedule Umbrella onboarding kickoff"),
          $status: single("Done"),
          $dueAt: date(daysAgo(12)),
        },
        {
          $owner: hasOne("member", "mem_sam"),
          "$task-account": hasOne("account", "acc_umbrella"),
        },
      ),
    ],

    note: [
      entity(
        "note_acme_exec",
        9,
        {
          $title: text("Acme exec briefing — key takeaways"),
          $content: markdown(
            "## Summary\n\nMet with **Jane Cooper** and the ops team.\n\n- Budget approved for expansion\n- Security review is the main blocker\n- Target signature: end of month",
          ),
        },
        {
          $account: hasOne("account", "acc_acme"),
          $opportunity: hasOne("opportunity", "opp_acme_expansion"),
        },
      ),
      entity(
        "note_globex_disc",
        14,
        {
          $title: text("Globex discovery call notes"),
          $content: markdown(
            "Lena wants a phased rollout across 3 plants. Pricing sensitivity is high — emphasize ROI within 2 quarters.",
          ),
        },
        {
          $account: hasOne("account", "acc_globex"),
          $opportunity: hasOne("opportunity", "opp_globex_pilot"),
        },
      ),
    ],

    meeting: [
      entity(
        "mtg_acme_legal",
        3,
        {
          $title: text("Acme — MSA legal review"),
          $startDate: date(daysAhead(3)),
          $meetingUrl: url("https://meet.example.com/acme-legal"),
          $participants: text("Riley Chen, Jane Cooper, Acme Legal"),
        },
        { $account: hasOne("account", "acc_acme") },
      ),
      entity(
        "mtg_globex_pilot",
        5,
        {
          $title: text("Globex — pilot scoping workshop"),
          $startDate: date(daysAhead(7)),
          $meetingUrl: url("https://meet.example.com/globex-pilot"),
          $participants: text("Sam Patel, Lena Fischer"),
        },
        { $account: hasOne("account", "acc_globex") },
      ),
      entity(
        "mtg_initech_demo",
        15,
        {
          $title: text("Initech — technical deep-dive (recap)"),
          $startDate: date(daysAgo(4)),
          $participants: text("Riley Chen, Peter Gibbons"),
        },
        { $account: hasOne("account", "acc_initech") },
      ),
    ],

    email: [
      entity(
        "eml_acme_msa",
        2,
        {
          $subject: text("Re: MSA redlines and security addendum"),
          $from: email("jane.cooper@acme.com"),
          $to: email("riley@yourco.com"),
          $sentAt: date(daysAgo(2)),
          $body: markdown(
            "Hi Riley,\n\nLegal had two more comments on the security addendum — see attached. If we can resolve these this week, we're on track for signature.\n\nBest,\nJane",
          ),
        },
        { $account: hasOne("account", "acc_acme") },
      ),
      entity(
        "eml_initech_pricing",
        4,
        {
          $subject: text("Updated pricing proposal"),
          $from: email("riley@yourco.com"),
          $to: email("peter@initech.dev"),
          $sentAt: date(daysAgo(4)),
          $body: markdown(
            "Hi Peter,\n\nAttached is the revised proposal with the usage-based tier we discussed. Happy to walk through it live.\n\nThanks,\nRiley",
          ),
        },
        { $account: hasOne("account", "acc_initech") },
      ),
    ],

    list: [
      entity(
        "list_target_accounts",
        50,
        {
          $name: text("Q3 Target Accounts"),
          $objectType: single("account"),
        },
        { accounts: hasMany("account", ["acc_acme", "acc_initech", "acc_stark"]) },
      ),
      entity(
        "list_champions",
        28,
        {
          $name: text("Champions"),
          $objectType: single("contact"),
        },
        { contacts: hasMany("contact", ["con_jane", "con_peter"]) },
      ),
    ],
  };
}
