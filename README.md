# Pulsar CRM

A complete CRM portal built on the [Lightfield API](https://docs.lightfield.app/) — an agent-native CRM platform. The portal gives you a fast, modern UI over your Lightfield workspace: accounts, contacts, opportunities, tasks, notes, meetings, emails, and lists.

**Live:** https://pulsar-web-app-chi.vercel.app · **Full project document (sales / dev / demo):** [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md)

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React Server Components, Turbopack) |
| Language | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react |
| Data fetching | TanStack React Query |
| Validation | Zod |
| CRM backend | Lightfield API via the official `lightfield` TypeScript SDK (server-side only) |
| Auth | Auth.js (NextAuth v5) credentials provider, JWT sessions |
| User store | Turso (libSQL / SQLite-compatible cloud DB) via `@libsql/client`; falls back to a local `data/app.db` file when `TURSO_*` env vars are unset |

## Features

- **Authentication** — register/login with email + password (bcrypt-hashed, stored in the Turso/libSQL user database). All portal pages and API routes are protected.
- **Dashboard** — record counts, open pipeline value, pipeline-by-stage breakdown, upcoming tasks, recent notes.
- **Accounts & Contacts** — searchable, paginated tables; detail pages with all fields and linked records; create/edit dialogs.
- **Opportunities** — kanban pipeline board grouped by stage (move deals between stages) plus a table view; create/edit.
- **Tasks & Notes** — list, detail, create/edit (markdown notes supported).
- **Meetings & Emails** — read-only activity views.
- **Lists** — curated record lists with member tables.
- **Schema-driven forms** — create/edit forms are generated from Lightfield field definitions, so custom fields work automatically.
- **Mock mode** — without an API key the portal serves realistic sample data so you can explore everything locally.

## Getting started

### 1. Requirements

- Node.js 20+ (22 LTS recommended)

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the template and fill in values:

```bash
cp .env.example .env.local
```

- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `LIGHTFIELD_API_KEY` — create in Lightfield settings (admin only). Select read scopes for all objects plus create/update scopes for accounts, contacts, opportunities, tasks, notes, and lists. **Leave empty to run in mock mode with sample data.**

The API key is only ever used server-side (route handlers / server components); it is never shipped to the browser.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, create an account on the register page, and sign in.

### Production build

```bash
npm run build
npm start
```

## Architecture

```
src/
├── app/
│   ├── (auth)/            # /login, /register
│   ├── (portal)/          # protected CRM pages (dashboard, accounts, …)
│   └── api/
│       ├── auth/          # Auth.js handlers + /api/auth/register
│       └── crm/           # generic proxy routes to the Lightfield API
├── components/
│   ├── crm/               # generic table/detail/form components (schema-driven)
│   ├── layout/            # sidebar + header
│   └── ui/                # shadcn/ui primitives
├── hooks/use-crm.ts       # React Query hooks for the CRM API
├── lib/
│   ├── lightfield/        # data layer: SDK source + mock source + types
│   ├── db.ts              # SQLite user store
│   └── format.ts          # field-value formatting helpers
├── auth.ts / auth.config.ts
└── proxy.ts               # route protection (Next.js 16 proxy)
```

Key design decisions:

- **Generic data layer** — every object type goes through one `CrmDataSource` interface with `list / retrieve / create / update / definitions`. The real implementation wraps the Lightfield SDK; a mock implementation provides sample data when no key is set.
- **Definitions-driven UI** — tables and forms read Lightfield `/definitions` schemas at runtime, so system and custom fields render with the right input types (select options, currency, dates, markdown, …) without code changes.
- **Server-side API key** — the browser only talks to `/api/crm/*` routes, which validate the session, validate input with Zod, and forward to Lightfield.

## Notes

- The Lightfield API is in beta; list endpoints cap pages at 25 records (the UI paginates accordingly).
- Emails are fetched via the raw HTTP client because the current SDK version does not yet expose an email resource.
