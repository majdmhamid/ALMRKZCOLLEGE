/**
 * Runs the real SQL migrations on PGlite (Postgres compiled to WASM) with small
 * stand-ins for the Supabase-only pieces (auth schema, roles, storage.buckets,
 * the realtime publication). Then checks constraints and RLS behaviour.
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS = path.join(__dirname, "..", "supabase", "migrations");

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create publication supabase_realtime;
`;

const ADMIN = "11111111-1111-1111-1111-111111111111";
const STRANGER = "22222222-2222-2222-2222-222222222222";
const HEX = "a".repeat(64);

let db: PGlite;

type Row = Record<string, unknown>;

async function asRole(role: "anon" | "authenticated", sub: string | null, sql: string) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`);
  try {
    return await db.query<Row>(sql);
  } finally {
    await db.exec("reset role;");
  }
}

async function one<T>(sql: string): Promise<T> {
  const r = await db.query<T>(sql);
  return r.rows[0];
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(MIGRATIONS, file), "utf8"));
  }
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.test'), ('${STRANGER}', 'x@example.test');
    insert into public.admin_profiles (user_id, display_name) values ('${ADMIN}', 'Admin');
  `);
});

afterAll(async () => {
  await db?.close();
});

describe("migrations", () => {
  it("create the private signing buckets, the public site-media bucket and the single settings row", async () => {
    const buckets = await db.query<{ id: string; public: boolean }>("select id, public from storage.buckets order by id");
    expect(buckets.rows).toEqual([
      { id: "finals", public: false },
      { id: "originals", public: false },
      { id: "signatures", public: false },
      // صور وفيديوهات الموقع (لوحة التحكم) — عامة للزوار
      { id: "site-media", public: true },
    ]);
    const settings = await db.query("select * from public.settings");
    expect(settings.rows).toHaveLength(1);
    await expect(db.exec("insert into public.settings (id) values (false)")).rejects.toThrow();
  });

  it("enable RLS on every public table", async () => {
    const res = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select c.relname, c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' order by 1`);
    expect(res.rows.length).toBeGreaterThanOrEqual(9);
    for (const row of res.rows) expect(row.relrowsecurity, row.relname).toBe(true);
  });

  it("add the live tables to the realtime publication", async () => {
    const res = await db.query<{ tablename: string }>(
      "select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by 1",
    );
    expect(res.rows.map((r) => r.tablename)).toEqual(["documents", "notifications", "signers"]);
  });
});

describe("constraints", () => {
  it("keep one ID per document, one admin slot, and placements inside the page", async () => {
    const { id: docId } = await one<{ id: string }>(
      `insert into public.documents (title, link_mode) values ('Doc', 'shared') returning id`,
    );
    await db.exec(`insert into public.signers (document_id, name, id_number_hash) values ('${docId}', 'A', '${HEX}')`);
    await expect(
      db.exec(`insert into public.signers (document_id, name, id_number_hash) values ('${docId}', 'B', '${HEX}')`),
    ).rejects.toThrow(/unique/i);

    await db.exec(`insert into public.signers (document_id, name, is_admin) values ('${docId}', 'Admin', true)`);
    await expect(
      db.exec(`insert into public.signers (document_id, name, is_admin) values ('${docId}', 'Admin2', true)`),
    ).rejects.toThrow(/unique/i);

    const { id: sid } = await one<{ id: string }>(`select id from public.signers where document_id = '${docId}' limit 1`);
    await db.exec(
      `insert into public.placements (document_id, signer_id, page, x, y, width, height)
       values ('${docId}', '${sid}', 1, 0.5, 0.5, 0.5, 0.5)`,
    );
    await expect(
      db.exec(
        `insert into public.placements (document_id, signer_id, page, x, y, width, height)
         values ('${docId}', '${sid}', 1, 0.6, 0.5, 0.5, 0.2)`,
      ),
    ).rejects.toThrow(/placements_inside_page/);
  });

  it("refuse a signed signer without a signature, and a shared token on a per-signer doc", async () => {
    const { id } = await one<{ id: string }>(`insert into public.documents (title) values ('Doc2') returning id`);
    await expect(
      db.exec(`insert into public.signers (document_id, name, status) values ('${id}', 'X', 'signed')`),
    ).rejects.toThrow(/signers_signed_has_signature/);
    await expect(
      db.exec(`insert into public.documents (title, link_mode, shared_token_hash) values ('D', 'per_signer', '${HEX}')`),
    ).rejects.toThrow(/documents_shared_token_mode/);
  });

  it("tie 'finalized' to having a final PDF", async () => {
    await expect(db.exec(`insert into public.documents (title, status) values ('D', 'finalized')`)).rejects.toThrow(
      /documents_final_matches_status/,
    );
  });
});

describe("functions", () => {
  it("rate_limit_hit allows up to the max per window", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      results.push((await one<{ ok: boolean }>(`select public.rate_limit_hit('t:key', 600, 3) as ok`)).ok);
    }
    expect(results).toEqual([true, true, true, false]);
  });

  it("signer_register_failure locks at 5", async () => {
    const { id: docId } = await one<{ id: string }>(`insert into public.documents (title) values ('Lock') returning id`);
    const { id: sid } = await one<{ id: string }>(
      `insert into public.signers (document_id, name) values ('${docId}', 'S') returning id`,
    );
    let last: { failed_attempts: number; locked: boolean } | undefined;
    for (let i = 0; i < 5; i++) {
      last = await one(`select * from public.signer_register_failure('${sid}', 5)`);
      if (i < 4) expect(last?.locked).toBe(false);
    }
    expect(last).toEqual({ failed_attempts: 5, locked: true });
  });

  it("shared_register_failure locks one device only", async () => {
    const { id } = await one<{ id: string }>(
      `insert into public.documents (title, link_mode) values ('Shared', 'shared') returning id`,
    );
    const devA = "b".repeat(64);
    const devB = "c".repeat(64);
    for (let i = 0; i < 5; i++) await db.query(`select * from public.shared_register_failure('${id}', '${devA}', 5)`);
    const other = await one<{ locked: boolean }>(`select * from public.shared_register_failure('${id}', '${devB}', 5)`);
    const locked = await one<{ locked: boolean }>(
      `select locked from public.shared_link_attempts where document_id = '${id}' and device_key = '${devA}'`,
    );
    expect(locked.locked).toBe(true);
    expect(other.locked).toBe(false);
  });
});

describe("row level security", () => {
  it("lets an admin read and write", async () => {
    const r = await asRole("authenticated", ADMIN, "select count(*)::int as n from public.documents");
    expect(r.rows[0].n).toBeGreaterThan(0);
    await asRole("authenticated", ADMIN, "insert into public.documents (title) values ('by admin')");
  });

  it("shows nothing to a signed-in user who is not an admin", async () => {
    const r = await asRole("authenticated", STRANGER, "select count(*)::int as n from public.documents");
    expect(r.rows[0].n).toBe(0);
    await expect(
      asRole("authenticated", STRANGER, "insert into public.documents (title) values ('nope')"),
    ).rejects.toThrow(/row-level security/i);
    const profiles = await asRole("authenticated", STRANGER, "select * from public.admin_profiles");
    expect(profiles.rows).toHaveLength(0);
  });

  it("denies the anon role entirely", async () => {
    await expect(asRole("anon", null, "select * from public.documents")).rejects.toThrow(/permission denied/i);
    await expect(asRole("anon", null, "select * from public.signers")).rejects.toThrow(/permission denied/i);
  });

  it("keeps rate_limits and the server-only functions away from admins' browsers", async () => {
    const r = await asRole("authenticated", ADMIN, "select * from public.rate_limits");
    expect(r.rows).toHaveLength(0);
    await expect(asRole("authenticated", ADMIN, "select public.rate_limit_hit('x', 60, 1)")).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("makes the audit trail append-only for admins", async () => {
    const { id } = await one<{ id: string }>(`select id from public.documents limit 1`);
    await asRole("authenticated", ADMIN, `insert into public.audit_events (document_id, event) values ('${id}', 'created')`);
    const upd = await asRole("authenticated", ADMIN, "update public.audit_events set event = 'opened' returning id");
    expect(upd.rows).toHaveLength(0);
  });
});
