import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// .env.local أولاً ثم .env (نفس ترتيب Next.js — الموجود أصلاً ما بيتغيّر)
for (const name of [".env.local", ".env"]) {
  const envFile = path.join(root, name);
  if (existsSync(envFile)) config({ path: envFile, quiet: true });
}

export function need(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`\n✗ ناقص ${name} بملف .env  (missing ${name} in .env / .env.local)\n`);
    process.exit(1);
  }
  return value;
}
