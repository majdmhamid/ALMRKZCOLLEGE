import { PGlite } from "@electric-sql/pglite";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { normalizeRow, type Db, type Row } from "./types";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

/**
 * Stand-ins for the Supabase-only pieces the migrations rely on: the auth
 * schema, API roles, storage.buckets and the realtime publication.
 */
export const SUPABASE_STUBS = `
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  end $$;
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  create schema if not exists storage;
  create table if not exists storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  do $$ begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end $$;
  create schema if not exists app_meta;
  create table if not exists app_meta.migrations (name text primary key, applied_at timestamptz not null default now());
`;

type Queryable = Pick<PGlite, "query">;

function wrap(conn: Queryable, transaction: <T>(fn: (db: Db) => Promise<T>) => Promise<T>): Db {
  return {
    async query<T>(text: string, params: readonly unknown[] = []) {
      const res = await conn.query<Row>(text, params as unknown[]);
      return res.rows.map((r) => normalizeRow<T>(r));
    },
    tx: transaction,
  };
}

export function pgliteDb(pg: PGlite): Db {
  const db: Db = wrap(pg, (fn) =>
    pg.transaction(async (t) => {
      // Nested tx() calls just reuse the open transaction.
      const inner: Db = wrap(t, (f) => f(inner));
      return fn(inner);
    }),
  );
  return db;
}

/** Applies stubs + any migrations not yet recorded in app_meta.migrations. */
export async function migratePglite(pg: PGlite): Promise<string[]> {
  await pg.exec(SUPABASE_STUBS);
  const done = new Set((await pg.query<{ name: string }>("select name from app_meta.migrations")).rows.map((r) => r.name));
  const applied: string[] = [];
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    await pg.transaction(async (t) => {
      await t.exec(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
      await t.query("insert into app_meta.migrations (name) values ($1)", [file]);
    });
    applied.push(file);
  }
  return applied;
}

export async function createPglite(dataDir?: string): Promise<PGlite> {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;
  await migratePglite(pg);
  return pg;
}
