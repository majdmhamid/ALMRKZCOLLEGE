import "server-only";
import path from "node:path";
import postgres from "postgres";
import { isMockBackend, mockDataDir } from "@/features/signing/lib/env";
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
    const opening = isMockBackend ? openMockDb() : Promise.resolve().then(() => openPostgres());
    // Don't cache a failure — the next request should try again.
    opening.catch(() => {
      if (g.__signingDb === opening) g.__signingDb = undefined;
    });
    g.__signingDb = opening;
  }
  return g.__signingDb;
}

/** A query that takes longer than this means a dead connection, not a slow query (ours all take milliseconds). */
const QUERY_TIMEOUT_MS = 20_000;

/** Connections in the pool, and so also the most queries we let run at the same time. */
const POOL_MAX = 5;

/**
 * postgres.js pipelines extra queries onto a busy connection when more than `max` run at once
 * (the documents page runs 6 in parallel, the menu 2 more), and Supabase's transaction pooler
 * never answers pipelined queries: the pages hung until Vercel's 5-minute timeout, and every later
 * query on that server instance queued behind it (2026-09-29, and again on 2026-09-30).
 * `max_pipeline: 1` does not stop it — it counts the queries queued *behind* the running one — and
 * `max_pipeline: 0` breaks transactions. So at most POOL_MAX queries (a transaction counts as one)
 * are handed to postgres.js at a time; the rest wait here. tests/db-no-pipelining.test.ts.
 */
function limiter(size: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async <T>(work: () => Promise<T>): Promise<T> => {
    if (active < size) active++;
    else await new Promise<void>((resolve) => waiting.push(resolve)); // the finishing query hands its slot over
    try {
      return await work();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  };
}

/** The real database (Supabase). `url` is only passed by tests. */
export function openPostgres(url = process.env.SUPABASE_DB_URL): Db {
  if (!url) throw new Error("SUPABASE_DB_URL is not set (see .env.example)");
  const sql = postgres(url, {
    prepare: false, // required by Supabase's transaction pooler
    max: POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
    onnotice: () => {},
    types: {
      // int8 → number (file sizes, counts); values here stay far below 2^53.
      bigint: { to: 20, from: [20], serialize: (v: number) => String(v), parse: (v: string) => Number(v) },
    },
  });
  // Safety net: if a query ever hangs anyway, fail it and throw the whole pool away, so the next
  // request opens fresh connections instead of waiting behind the stuck one.
  const reset = () => {
    const cached = g.__signingDb;
    void cached?.then((current) => {
      if (current === db && g.__signingDb === cached) g.__signingDb = undefined;
    });
    void sql.end({ timeout: 0 }).catch(() => {});
  };
  const db = wrapPostgres(sql, reset, limiter(POOL_MAX));
  return db;
}

function withTimeout<T>(work: Promise<T>, onTimeout: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`signing database query timed out after ${QUERY_TIMEOUT_MS / 1000}s`));
    }, QUERY_TIMEOUT_MS);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

type Limit = ReturnType<typeof limiter>;
/** Inside a transaction the queries run on its own connection, one after another: no limit needed. */
const unlimited: Limit = (work) => work();

function wrapPostgres(sql: postgres.Sql | postgres.TransactionSql, reset: () => void, limit: Limit): Db {
  return {
    async query<T>(text: string, params: readonly unknown[] = []) {
      const rows = await limit(() => withTimeout(sql.unsafe<Row[]>(text, params as postgres.ParameterOrJSON<never>[]), reset));
      return rows.map((r) => normalizeRow<T>(r));
    },
    async tx<T>(fn: (db: Db) => Promise<T>) {
      if ("savepoint" in sql) return fn(wrapPostgres(sql, reset, unlimited)); // already inside a transaction
      return limit(async () => (await (sql as postgres.Sql).begin((t) => fn(wrapPostgres(t, reset, unlimited)))) as T);
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
