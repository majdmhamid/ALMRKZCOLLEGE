/**
 * Dev helper: merges messages/_add.<locale>.json into messages/<locale>.json
 * (section by section), deletes the _add files, and reports keys that exist in
 * one language but not the other.
 * Usage: node scripts/merge-messages.mjs
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { root } from "./load-env.mjs";

const dir = path.join(root, "messages");
const locales = ["he", "ar"];

for (const locale of locales) {
  const addFile = path.join(dir, `_add.${locale}.json`);
  if (!existsSync(addFile)) continue;
  const file = path.join(dir, `${locale}.json`);
  const base = JSON.parse(readFileSync(file, "utf8"));
  const add = JSON.parse(readFileSync(addFile, "utf8"));
  for (const [section, value] of Object.entries(add)) {
    if (value === null) delete base[section];
    else base[section] = { ...(base[section] ?? {}), ...value };
    for (const [k, v] of Object.entries(value ?? {})) if (v === null) delete base[section][k];
  }
  writeFileSync(file, JSON.stringify(base, null, 2) + "\n");
  unlinkSync(addFile);
  console.log(`  merged ${locale}`);
}

const keys = (o, prefix = "") =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
const [he, ar] = locales.map((l) => new Set(keys(JSON.parse(readFileSync(path.join(dir, `${l}.json`), "utf8")))));
const onlyHe = [...he].filter((k) => !ar.has(k));
const onlyAr = [...ar].filter((k) => !he.has(k));
if (onlyHe.length || onlyAr.length) {
  console.error("  ✗ mismatch", { onlyHe, onlyAr });
  process.exitCode = 1;
} else {
  console.log(`  ✓ ${he.size} keys in both languages`);
}
