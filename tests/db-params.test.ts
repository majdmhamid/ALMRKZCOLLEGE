import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * postgres.js (the real database driver on Vercel) JSON-encodes a string a second time when the
 * query says `$1::jsonb`, so the database stores a JSON *string* instead of an object/list.
 * PGlite (these tests, mock mode) doesn't, so this is checked on the SQL text instead.
 * Found in the production rehearsal (2026-09-28) — see src/features/signing/server/db/types.ts.
 */
const ROOTS = ["src/features/signing", "src/app/(sign)", "src/admin/signing"].map((d) => path.join(__dirname, "..", d));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const full = path.join(dir, f);
    return statSync(full).isDirectory() ? files(full) : /\.tsx?$/.test(f) ? [full] : [];
  });
}

describe("SQL parameters", () => {
  it("never cast a parameter straight to json/jsonb (use $n::text::jsonb)", () => {
    const bad = ROOTS.flatMap(files).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((line, i) => ({ line, at: `${path.relative(path.join(__dirname, ".."), file)}:${i + 1}` }))
        .filter(({ line }) => /\$\d+::jsonb?\b/.test(line))
        .map(({ at }) => at),
    );
    expect(bad).toEqual([]);
  });
});
