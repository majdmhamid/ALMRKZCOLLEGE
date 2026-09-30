/**
 * Fills PAYLOAD_SECRET, TOKEN_ENC_KEY, SESSION_SECRET and CRON_SECRET in
 * .env.local — only the ones that are empty or missing. Never overwrites an
 * existing value — also one already set in .env (a new one in .env.local would hide it).
 * Usage: npm run secrets
 */
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { root } from "./load-env.mjs";

const file = path.join(root, ".env.local");
const dotEnv = path.join(root, ".env");
const dotEnvText = existsSync(dotEnv) ? readFileSync(dotEnv, "utf8") : "";
if (!existsSync(file)) {
  if (existsSync(dotEnv)) {
    // .env موجود: .env.local بس للمفاتيح (نسخة من .env.example كانت رح تغطّي على قيم .env)
    writeFileSync(file, "");
    console.log("  أنشأت .env.local للمفاتيح بس");
  } else {
    copyFileSync(path.join(root, ".env.example"), file);
    console.log("  أنشأت .env.local من .env.example");
  }
}

const generators = {
  PAYLOAD_SECRET: () => randomBytes(32).toString("hex"),
  TOKEN_ENC_KEY: () => randomBytes(32).toString("base64"),
  SESSION_SECRET: () => randomBytes(48).toString("base64url"),
  // Vercel Cron → /api/payload-jobs/run (news «schedule publish»). Can be changed any time.
  CRON_SECRET: () => randomBytes(32).toString("hex"),
};

let text = readFileSync(file, "utf8");
for (const [name, make] of Object.entries(generators)) {
  const re = new RegExp(`^${name}=(.*)$`, "m");
  const match = text.match(re);
  const inDotEnv = dotEnvText.match(re);
  if (match && match[1].trim()) {
    console.log(`  ✓ ${name} موجود — ما لمسته`);
  } else if (inDotEnv && inDotEnv[1].trim()) {
    // سطر فاضي بـ .env.local كان رح يغطّي على القيمة اللي بـ .env — منشيله
    text = text.replace(new RegExp(`^${name}=[ \t]*\r?\n?`, "m"), "");
    console.log(`  ✓ ${name} موجود بـ .env — ما لمسته`);
  } else if (match) {
    text = text.replace(re, `${name}=${make()}`);
    console.log(`  + ${name}`);
  } else {
    text += `\n${name}=${make()}\n`;
    console.log(`  + ${name}`);
  }
}
writeFileSync(file, text);
console.log("\n✓ المفاتيح السرية جاهزة بملف .env.local\n");
