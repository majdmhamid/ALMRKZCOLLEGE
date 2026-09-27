import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (existsSync(envFile)) config({ path: envFile, quiet: true });

export function need(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`\n✗ ناقص ${name} بملف .env.local  (missing ${name} in .env.local)\n`);
    process.exit(1);
  }
  return value;
}
