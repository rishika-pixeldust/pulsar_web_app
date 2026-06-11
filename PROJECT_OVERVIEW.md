# Pulsar CRM — End-to-End Project Document

> One document for everyone: sales, the development team, and anyone running a demo.
> It explains **what Pulsar is, what it does, how it's built, where it lives, and how to show it off.**

- **Live application:** https://pulsar-web-app-chi.vercel.app
- **Source code (public):** https://github.com/rishika-pixeldust/pulsar_web_app
- **Status:** Deployed to production, publicly accessible, connected to a live cloud database.
- **Last updated:** 2026-06-10

---

## Table of contents

1. [The 60-second summary](#1-the-60-second-summary)
2. [For salespeople — what Pulsar is and why it matters](#2-for-salespeople)
3. [What the product does (feature catalog)](#3-what-the-product-does)
4. [The demo — a guided walkthrough](#4-the-demo-walkthrough)
5. [For the development team — architecture](#5-for-the-development-team-architecture)
6. [The data model](#6-the-data-model)
7. [Infrastructure & how it's deployed](#7-infrastructure--how-its-deployed)
8. [Security & access model](#8-security--access-model)
9. [Local development setup](#9-local-development-setup)
10. [Operations runbook](#10-operations-runbook)
11. [Known limitations & roadmap](#11-known-limitations--roadmap)
12. [Glossary](#12-glossary)

---

## 1. The 60-second summary

**Pulsar CRM** is a fast, modern web portal that sits on top of the **Lightfield CRM platform**. Lightfield stores the customer data (accounts, contacts, deals, tasks, notes, meetings, emails); Pulsar is the polished user interface your team actually works in — dashboards, searchable tables, a drag-style deal pipeline, and create/edit forms.

Two things make it notable:

- **It adapts to your data automatically.** Pulsar reads Lightfield's field "definitions" at runtime, so any custom field you add in Lightfield shows up in Pulsar's tables and forms with the correct input type — no code changes.
- **It runs with or without a real CRM key.** With a Lightfield API key it shows live data; without one it serves realistic **sample data** ("mock mode") so anyone can explore the full product instantly.

It is built on Next.js 16 + TypeScript, secured with email/password login, and is **live on the internet right now** at the URL above, backed by a cloud database.

---

## 2. For salespeople

### What problem does it solve?
Modern CRMs hold the data, but the day-to-day experience is often slow, cluttered, or locked behind clunky admin screens. **Pulsar is a clean, focused "work surface"** over the CRM: the screens a rep uses 50 times a day — see my accounts, find a contact, move a deal forward, check what's due — made fast and pleasant.

### The pitch in one line
> "Your CRM data, in an interface your team will actually enjoy using — and it automatically matches however you've customized your CRM."

### Key talking points
- **Complete coverage.** Accounts, Contacts, Opportunities (deals), Tasks, Notes, Meetings, Emails, and Lists — all in one portal.
- **A real sales dashboard.** Open pipeline value, deals broken down by stage, upcoming tasks, and recent activity, on the landing screen.
- **A visual deal pipeline.** Opportunities are shown as a board grouped by stage, so the state of the business is obvious at a glance.
- **It fits the customer's setup.** Custom fields configured in Lightfield appear automatically — currency fields format as money, dropdowns show the right options, dates render properly. No "we'll need a custom build for that."
- **Instant demo, no setup.** Because of mock mode, you can show the entire product on any laptop or the live URL without needing the customer's real credentials.
- **Secure by design.** Every page requires login; the CRM API key never touches the browser.

### What to set expectations on
- This is a **portal/front-end built on Lightfield** — Lightfield is the system of record. Pulsar's strength is the experience and the automatic adaptation to the customer's schema.
- The current public demo shows **real CRM data to anyone who signs up** (a deliberate demo choice). For a customer-facing or production rollout we would gate sign-ups (invite codes / allow-list) — that's a small, known change.

---

## 3. What the product does

| Area | What it does |
| --- | --- |
| **Authentication** | Register and log in with email + password. Passwords are hashed (bcrypt). Every portal page and data route requires a valid session. |
| **Dashboard** | Headline metrics (Accounts, Contacts, Open Opportunities, Open Tasks), total open **pipeline value**, a **pipeline-by-stage** breakdown, upcoming tasks, and recent notes. |
| **Accounts & Contacts** | Searchable, paginated tables. Detail pages show every field plus linked records. Create and edit via dialogs. |
| **Opportunities (deals)** | A **pipeline board** grouped by stage to see/advance deals, plus a table view. Create and edit. |
| **Tasks & Notes** | List, detail, and create/edit. Notes support Markdown. |
| **Meetings & Emails** | Read-only activity views (calendar events and email history). |
| **Lists** | Curated record lists with their member tables (e.g. a targeted set of accounts or contacts). |
| **Schema-driven forms** | Create/edit forms are generated from Lightfield's field definitions, so system fields **and** custom fields work automatically with the right input controls. |
| **Mock mode** | With no API key, the whole portal runs on built-in realistic sample data. |

---

## 4. The demo walkthrough

**Demo URL:** https://pulsar-web-app-chi.vercel.app

> Note: the live deployment is connected to a **real Lightfield workspace**, so what you see is live data. To demo on sample data instead, run it locally with no API key (see [§9](#9-local-development-setup)) — the experience is identical.

A suggested 5–7 minute flow:

1. **Open the URL.** You land on the **login** screen (`/login`). Point out it's gated — nothing is visible without an account.
2. **Register a user** (`/register`): name, email, password. This creates an account in the cloud database and logs you in.
3. **Dashboard.** Walk through the headline numbers, the **pipeline value**, and the **by-stage breakdown**. This is the "state of the business" screen.
4. **Accounts → search & open one.** Show the searchable table, then open a detail page to show all fields and linked contacts/opportunities.
5. **Opportunities → the pipeline board.** This is the visual highlight — deals grouped by stage. Open one and **edit a field** to show writes flow back to the CRM.
6. **Create a record.** Use a create dialog (e.g. a new Contact or Task) and point out that the **form fields come straight from the CRM's schema** — including any custom fields.
7. **Tasks / Notes.** Show the "what's due" view and a Markdown note.
8. **Wrap up** on the dashboard. Reinforce: clean UX, complete object coverage, and automatic schema adaptation.

**Demo tips**
- The header shows a **"mock mode"** indicator when running on sample data — useful to mention you can demo anywhere with zero setup.
- If demoing live data, avoid editing real customer records unless intended.

---

## 5. For the development team (architecture)

### Stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16** (App Router, React Server Components, Turbopack) |
| Language | **TypeScript** |
| UI | **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) + lucide-react icons |
| Client data fetching | **TanStack React Query** |
| Validation | **Zod** |
| CRM backend | **Lightfield API** via the official `lightfield` TypeScript SDK (server-side only) |
| Auth | **Auth.js (NextAuth v5)** — credentials provider, JWT sessions |
| User store | **Turso** (libSQL / SQLite-compatible cloud database) via `@libsql/client` |
| Hosting | **Vercel** (serverless) |

> Note: an earlier revision used a local `better-sqlite3` SQLite file. It was migrated to **Turso** so user accounts persist on Vercel's serverless infrastructure (see [§7](#7-infrastructure--how-its-deployed)).

### Directory structure

```
src/
├── app/
│   ├── (auth)/            # /login, /register (public)
│   ├── (portal)/          # protected CRM pages: dashboard, accounts, contacts,
│   │                      #   opportunities, tasks, notes, meetings, emails, lists
│   └── api/
│       ├── auth/          # Auth.js handlers + /api/auth/register
│       └── crm/           # generic proxy routes to the Lightfield API
├── components/
│   ├── crm/               # generic, schema-driven table / detail / form components
│   ├── layout/            # sidebar nav + header
│   └── ui/                # shadcn/ui primitives
├── hooks/use-crm.ts       # React Query hooks for the CRM API
├── lib/
│   ├── lightfield/        # the data layer (see below)
│   ├── db.ts              # user store (Turso/libSQL)
│   ├── api-helpers.ts     # session guard, input parsing, error mapping for API routes
│   └── format.ts          # field-value formatting helpers
├── auth.ts / auth.config.ts   # Auth.js setup (config is edge-safe & shared with proxy)
├── proxy.ts               # route protection (Next.js 16 "proxy", formerly middleware)
└── types/                 # ambient type augmentation (next-auth session)
```

### The data layer — the heart of the design

Everything CRM-related goes through **one interface**, `CrmDataSource` (`src/lib/lightfield/types.ts`):

```ts
interface CrmDataSource {
  list(type, params)            // paginated list
  retrieve(type, id)            // single record
  create(type, body)            // create
  update(type, id, body)        // update
  definitions(type)             // the field/relationship schema for a type
  listMembers(listId, ...)      // members of a List
}
```

There are **two implementations**, selected at runtime in `src/lib/lightfield/index.ts`:

- **`createSdkSource(apiKey)`** — wraps the real Lightfield SDK. Used when `LIGHTFIELD_API_KEY` is set.
- **`createMockSource()`** — in-memory realistic sample data. Used when there is **no** key (`isMockMode()` returns true).

Because the rest of the app only knows about `CrmDataSource`, **mock mode and live mode are indistinguishable to every page and component.**

### Definitions-driven UI

The `definitions(type)` call returns each field's `valueType` (`CURRENCY`, `DATETIME`, `SINGLE_SELECT`, `MARKDOWN`, `EMAIL`, …) and config (currency code, select options, etc.). Tables and forms read this at runtime, so:

- New/custom fields in Lightfield appear automatically.
- Each field renders with the correct input control and formatting.
- No per-field code is required.

### Request flow (end-to-end)

```
Browser (React Query hooks in hooks/use-crm.ts)
   │  fetch /api/crm/...
   ▼
Next.js API route (src/app/api/crm/**)
   │  api-helpers.ts:
   │   1. requireSession()  → 401 if not logged in
   │   2. Zod validation of input
   │   3. parse object type / list params
   ▼
CrmDataSource (SDK source or mock source)   ← LIGHTFIELD_API_KEY decides which
   │  (SDK source calls the Lightfield API with the server-side key)
   ▼
Response mapped to shared CrmEntity shape → JSON back to the browser
```

The **API key is only ever used server-side**. The browser never sees it; it only talks to `/api/crm/*`.

### Authentication flow

- `src/auth.config.ts` — **edge-safe** config shared by both the proxy and the full auth setup. Its `authorized` callback redirects unauthenticated users to `/login` and bounces logged-in users away from the auth pages.
- `src/auth.ts` — full NextAuth setup with the **Credentials** provider. `authorize()` looks the user up in the database (`findUserByEmail`) and verifies the bcrypt password hash. `trustHost: true` is set so it works behind Vercel's proxy.
- `src/proxy.ts` — Next.js 16 proxy (formerly middleware) that enforces protection on all routes except Auth.js endpoints and static assets.
- Sessions are **JWT**-based (no server session store needed).

### User store (`src/lib/db.ts`)

A single `users` table (`id`, `name`, `email` unique, `password_hash`, `created_at`). The module:

- Connects via `@libsql/client`. In production it uses the **Turso** database (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`); locally, with no Turso env vars, it falls back to a local SQLite file at `./data/app.db` — so local dev needs zero extra config.
- Creates the table on first use (`ensureSchema`), exposes `findUserByEmail` and `createUser` (both async).

---

## 6. The data model

Pulsar understands these Lightfield object types (`src/lib/lightfield/objects.ts`). Each has a display label, the field used as its "name", whether it's writable from the portal, and preferred table columns.

| Object | Writable? | Primary field | Typical columns |
| --- | --- | --- | --- |
| **Account** | ✅ | `$name` | name, website, industry, headcount |
| **Contact** | ✅ | `$name` | name, email, title, phone |
| **Opportunity** | ✅ | `$name` | name, stage, amount, close date |
| **Task** | ✅ | `$title` | title, status, due date |
| **Note** | ✅ | `$title` | title, content (Markdown) |
| **Meeting** | read-only | `$title` | title, start date, meeting URL |
| **Email** | read-only | `$subject` | subject, from, sent at |
| **List** | ✅ | `$name` | name, object type |
| **Member** | read-only | `$name` | name, email, role |

**Core record shape** (`CrmEntity`): `id`, `createdAt`/`updatedAt`, `externalId`, `httpLink`, a map of `fields` (each a `{ value, valueType }`), and a map of `relationships` (each with `cardinality`, `objectType`, and related `values`). Fields prefixed with `$` are Lightfield **system** fields; custom fields use their own keys.

---

## 7. Infrastructure & how it's deployed

### The three external services

1. **GitHub** — source of truth for the code.
   - Repo: https://github.com/rishika-pixeldust/pulsar_web_app (**public**)
   - Account/org: `rishika-pixeldust`
2. **Vercel** — hosts the running app (serverless).
   - Project: `pulsar-web-app` under team `rishika-s-projects5`
   - Production URL: **https://pulsar-web-app-chi.vercel.app**
3. **Turso** — the cloud database that stores user accounts.
   - Database: `pulsar`, region `aws-ap-south-1`
   - libSQL / SQLite-compatible; accessed over HTTPS from the Vercel functions.

### Why Turso (and not a local SQLite file)?
Vercel runs the app as **serverless functions** with an ephemeral, mostly read-only filesystem. A local SQLite file would be wiped on every deploy/cold start, so **registered users would disappear**. Turso is a hosted libSQL database, so data persists. The code change was minimal because libSQL is SQLite-compatible — only `src/lib/db.ts` changed (`better-sqlite3` → `@libsql/client`), with the data-access functions made async.

### Environment variables (set in Vercel, for Production/Preview/Development)

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Signs/encrypts Auth.js JWT sessions. |
| `TURSO_DATABASE_URL` | The Turso database URL (`libsql://pulsar-…turso.io`). |
| `TURSO_AUTH_TOKEN` | Auth token for the Turso database. |
| `LIGHTFIELD_API_KEY` | Server-side Lightfield key. Present → live data; absent → mock mode. |

> These are **secrets**. They are not committed to the repo (`.gitignore` excludes `.env*` and `/data`). Only `.env.example` (a template) is in git.

### How the current deployment was produced
The project was deployed via the **Vercel CLI** (`vercel deploy --prod`), which builds on Vercel's infrastructure (Node 22) and serves from the production alias. Deployment Protection (Vercel Authentication) was **disabled** so the public can reach it.

> ⚠️ **Auto-deploy is not yet connected.** Because we deployed via CLI, pushing to GitHub does **not** automatically redeploy. To enable that, connect the repo under **Vercel → Project → Settings → Git** (then every push to `main` deploys automatically).

---

## 8. Security & access model

### What's protected
- All portal pages and `/api/crm/*` routes require a logged-in session (enforced by `proxy.ts` + `requireSession()`).
- Passwords are bcrypt-hashed; the raw password is never stored.
- The Lightfield API key is server-side only and never sent to the browser.
- App secrets are kept in environment variables, not in the repo.

### ⚠️ Important: the current public demo exposes real CRM data
The live site currently uses a **real Lightfield API key**, and **registration is open to anyone**. Because Lightfield is accessed with a single shared server-side key, **every person who signs up sees the same real CRM data** (accounts, contacts, deals, notes — including third parties' personal information). This was a deliberate choice for the demo.

**Before any customer-facing or production use**, lock this down with one of:
- **Invite code / email allow-list** on registration (small code change), or
- **Mock data only** in the public deployment (remove `LIGHTFIELD_API_KEY`), or
- **No self-signup** (admin creates accounts), or
- Re-enable **Vercel Authentication** to gate the whole site.

Note also that secrets shared during setup (the Turso token, `AUTH_SECRET`, Lightfield key) can be **rotated** at any time if needed.

---

## 9. Local development setup

**Requirements:** Node.js 20+ (22 LTS recommended). Next.js 16 will not run on Node 18.

```bash
# 1. Install
npm install

# 2. Configure (optional — without a key you get mock mode)
cp .env.example .env.local
#   AUTH_SECRET           → openssl rand -base64 32
#   LIGHTFIELD_API_KEY    → leave empty for mock mode, or set a real key
#   TURSO_* (optional)    → leave empty to use a local ./data/app.db file

# 3. Run
npm run dev
# open http://localhost:3000, register, sign in
```

**Production build (local):**
```bash
npm run build && npm start
```

- With **no** `LIGHTFIELD_API_KEY`, the portal runs entirely on sample data — ideal for development and offline demos.
- With **no** `TURSO_*` vars, user accounts are stored in a local SQLite file at `./data/app.db` (gitignored).

---

## 10. Operations runbook

> Most commands need the Vercel CLI and Node 22 (`nvm use 22`).

**Redeploy to production**
```bash
vercel deploy --prod --yes
```

**View / change environment variables**
```bash
vercel env ls
vercel env pull /tmp/prod.env --environment=production   # inspect current values
# add/update via dashboard (Project → Settings → Environment Variables) or the API
```
After changing env vars, **redeploy** — they only apply to new deployments.

**Inspect the database**
```bash
turso db shell pulsar "SELECT count(*) FROM users;"
turso db shell pulsar "SELECT email, created_at FROM users ORDER BY created_at DESC;"
```

**Toggle public access (Deployment Protection)** — Vercel → Project → Settings → Deployment Protection → Vercel Authentication.

**Connect Git for auto-deploy** — Vercel → Project → Settings → Git → connect `rishika-pixeldust/pulsar_web_app`.

**Switch the live demo to safe sample data** — remove `LIGHTFIELD_API_KEY` from Vercel and redeploy (the app falls back to mock mode automatically).

---

## 11. Known limitations & roadmap

**Current limitations**
- Lightfield API is in beta; list endpoints cap pages at **25 records** (the UI paginates accordingly).
- Emails are read via the raw HTTP client because the current SDK version doesn't expose an email resource.
- Meetings and Emails are **read-only**.
- Auto-deploy from GitHub is **not yet connected** (deployed via CLI).
- Public registration currently exposes real CRM data (see [§8](#8-security--access-model)).

**Natural next steps**
- Gate registration (invite codes / allow-list) for any real rollout.
- Connect GitHub → Vercel for automatic deploys on push.
- Add a custom domain.
- Per-user / per-tenant Lightfield credentials if multi-tenant access is needed.
- Optional: rotate the secrets that were shared during initial setup.

---

## 12. Glossary

- **Lightfield** — the CRM platform that is the system of record for all customer data. Pulsar is a front-end on top of it.
- **Mock mode** — Pulsar serving built-in sample data when no Lightfield API key is configured.
- **Definitions / schema** — Lightfield's description of each object's fields and types; Pulsar reads these to render tables and forms dynamically.
- **CrmDataSource** — the single internal interface every CRM operation goes through; has a live (SDK) and a mock implementation.
- **Turso / libSQL** — the SQLite-compatible cloud database storing user accounts so they persist on serverless hosting.
- **Vercel** — the serverless platform hosting the app.
- **Auth.js (NextAuth)** — the authentication library handling login, sessions, and route protection.
- **Proxy (middleware)** — the Next.js 16 layer that redirects unauthenticated requests to the login page.
```
