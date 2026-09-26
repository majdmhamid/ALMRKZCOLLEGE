import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createPglite, pgliteDb } from "@/server/db/pglite";
import type { Db } from "@/server/db/types";

export const TEST_ADMIN_ID = "00000000-0000-4000-8000-0000000000aa";

/**
 * A fresh in-memory Postgres with the real migrations, plus a temp folder for
 * mock storage. Call cleanup() in afterAll.
 */
export async function testBackend() {
  const dir = mkdtempSync(path.join(tmpdir(), "signing-test-"));
  process.env.MOCK_DATA_DIR = dir;
  const pg = await createPglite();
  const db: Db = pgliteDb(pg);
  await db.query(`insert into auth.users (id, email) values ($1, 'admin@example.test')`, [TEST_ADMIN_ID]);
  await db.query(`insert into public.admin_profiles (user_id, display_name) values ($1, 'Admin')`, [TEST_ADMIN_ID]);
  const ctx = {
    db,
    admin: { userId: TEST_ADMIN_ID, email: "admin@example.test", displayName: "Admin" },
    ip: "10.1.2.3",
    userAgent: "vitest",
  };
  return {
    db,
    ctx,
    dir,
    async cleanup() {
      await pg.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
