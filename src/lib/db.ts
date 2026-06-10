import "server-only";

import { createClient, type Client } from "@libsql/client";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

const globalForDb = globalThis as unknown as {
  __appDb?: Client;
  __appDbInit?: Promise<void>;
};

function createDbClient(): Client {
  // Production: a Turso (libSQL) database. Local dev: falls back to a local
  // SQLite file so the app runs with zero extra config.
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/app.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

function getClient(): Client {
  globalForDb.__appDb ??= createDbClient();
  return globalForDb.__appDb;
}

async function ensureSchema(): Promise<void> {
  globalForDb.__appDbInit ??= getClient()
    .execute(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
    )
    .then(() => undefined);
  return globalForDb.__appDbInit;
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email],
  });
  const row = result.rows[0];
  return row ? (row as unknown as UserRow) : undefined;
}

export async function createUser(user: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  await ensureSchema();
  const id = crypto.randomUUID();
  await getClient().execute({
    sql: "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    args: [id, user.name, user.email, user.passwordHash],
  });
  return (await findUserByEmail(user.email))!;
}
