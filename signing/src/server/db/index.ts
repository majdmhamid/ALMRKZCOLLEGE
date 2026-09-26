import "server-only";
import path from "node:path";
import postgres from "postgres";
import { isMockBackend, mockDataDir } from "@/lib/env";
import { normalizeRow, type Db, type Row } from "./types";

export type { Db } from "./types";
export { jsonList } from "./types";

type Globals = { __signingDb?: Promise<Db> };
const g = globalThis as Globals;

/**
 * The app's database handle (server only; bypasses RLS like the service role).
 * - Real: postgres.js over Supabase's transaction pooler (prepare: false).
 * - Mock: PGlite on disk in .mock-data/pgdata, with the real migrations + seed data.
 * Cached on globalThis so dev hot-reloads don't open a second handle.
 */
export function getDb(): Promise<Db> {
  if (!g.__signingDb) {
    const opening = isMockBackend ? openMockDb() : Promise.resolve().then(openPostgres);
    // Don't cache a failure — the next request should try again.
    opening.catch(() => {
      if (g.__signingDb === opening) g.__signingDb = undefined;
    });
    g.__signingDb = opening;
  }
  return g.__signingDb;
}

function openPostgres(): Db {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set (see .env.example)");
  const sql = postgres(url, {
    prepare: false, // required by Supabase's transaction pooler
    max: 5,
    idle_timeout: 20,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
    onnotice: () => {},
    types: {
      // int8 → number (file sizes, counts); values here stay far below 2^53.
      bigint: { to: 20, from: [20], serialize: (v: number) => String(v), parse: (v: string) => Number(v) },
    },
  });
  return wrapPostgres(sql);
}

function wrapPostgres(sql: postgres.Sql | postgres.TransactionSql): Db {
  return {
    async query<T>(text: string, params: readonly unknown[] = []) {
      const rows = await sql.unsafe<Row[]>(text, params as postgres.ParameterOrJSON<never>[]);
      return rows.map((r) => normalizeRow<T>(r));
    },
    async tx<T>(fn: (db: Db) => Promise<T>) {
      if ("savepoint" in sql) return fn(wrapPostgres(sql)); // already inside a transaction
      return (await (sql as postgres.Sql).begin((t) => fn(wrapPostgres(t)))) as T;
    },
  };
}

async function openMockDb(): Promise<Db> {
  const { createPglite, pgliteDb } = await import("./pglite");
  const { seedMockData } = await import("./seed");
  const pg = await createPglite(path.join(mockDataDir(), "pgdata"));
  const db = pgliteDb(pg);
  await seedMockData(db);
  return db;
}
