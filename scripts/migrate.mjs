/**
 * Applies supabase/migrations/*.sql in order, each in its own transaction, and
 * records what ran in app_meta.migrations (a schema the Supabase API doesn't expose).
 * Usage: npm run db:migrate
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { need, root } from "./load-env.mjs";

const dir = path.join(root, "supabase", "migrations");
const sql = postgres(need("SUPABASE_DB_URL"), { ssl: "require", max: 1, onnotice: () => {} });

try {
  await sql`create schema if not exists app_meta`;
  await sql`create table if not exists app_meta.migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select name from app_meta.migrations`).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log(`  ✓ ${file} (موجود من قبل)`);
      continue;
    }
    const body = readFileSync(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into app_meta.migrations (name) values (${file})`;
    });
    console.log(`  + ${file}`);
    applied++;
  }
  console.log(applied ? `\n✓ تم — ${applied} ملف جديد\n` : "\n✓ قاعدة البيانات محدّثة، ما في إشي جديد\n");
} catch (err) {
  console.error("\n✗ فشل التحديث:", err.message, "\n");
  process.exitCode = 1;
} finally {
  await sql.end();
}
