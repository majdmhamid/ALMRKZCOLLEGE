import { describe, expect, it } from "vitest";
import { checkEnv } from "../scripts/check-env.mjs";

type Result = { errors: string[]; warnings: string[] };
const run = (env: Record<string, string>, db?: { hasAdmin?: boolean | null; devPush?: boolean }): Result => checkEnv(env, db);

const DB = "postgresql://postgres.abc:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
const GOOD: Record<string, string> = {
  DATABASE_URL: DB,
  SUPABASE_DB_URL: DB,
  PAYLOAD_SECRET: "a".repeat(64),
  ID_HMAC_SECRET: "b".repeat(64),
  SESSION_SECRET: "c".repeat(64),
  TOKEN_ENC_KEY: Buffer.alloc(32, 1).toString("base64"),
  CRON_SECRET: "d".repeat(64),
  NEXT_PUBLIC_SERVER_URL: "https://almrkz.vercel.app",
  NEXT_PUBLIC_APP_URL: "https://almrkz.vercel.app/",
  S3_BUCKET: "media",
  S3_REGION: "eu-central-1",
  S3_ENDPOINT: "https://abc.supabase.co/storage/v1/s3",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "x".repeat(40),
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "college@gmail.com",
  SMTP_PASS: "abcdabcdabcdabcd",
  EMAIL_FROM_ADDRESS: "college@gmail.com",
  SEED_ADMIN_EMAIL: "admin@example.com",
  SEED_ADMIN_PASSWORD: "a-long-password",
};

describe("check-env (Vercel preflight)", () => {
  it("passes a complete production setup", () => {
    expect(run(GOOD, { hasAdmin: false })).toEqual({ errors: [], warnings: [] });
  });

  it("refuses a local database, a placeholder password and push mode", () => {
    expect(run({ ...GOOD, DATABASE_URL: "file:./almrkz-local.db" }).errors.join()).toMatch(/DATABASE_URL/);
    expect(run({ ...GOOD, DATABASE_URL: DB.replace("pw", "[YOUR-PASSWORD]") }).errors.join()).toMatch(/YOUR-PASSWORD/);
    expect(run({ ...GOOD, PAYLOAD_DB_PUSH: "true" }).errors.join()).toMatch(/PAYLOAD_DB_PUSH/);
    // Vercel has no IPv6 → Supabase's direct connection is unreachable; the session pooler runs out of clients.
    const direct = "postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres";
    expect(run({ ...GOOD, DATABASE_URL: direct }).errors.join()).toMatch(/Direct/);
    expect(run({ ...GOOD, SUPABASE_DB_URL: DB.replace(":6543", ":5432") }).warnings.join()).toMatch(/6543/);
  });

  it("checks the signing secrets are well-formed", () => {
    expect(run({ ...GOOD, TOKEN_ENC_KEY: "short" }).errors.join()).toMatch(/TOKEN_ENC_KEY/);
    expect(run({ ...GOOD, SESSION_SECRET: "" }).errors.join()).toMatch(/SESSION_SECRET/);
    expect(run({ ...GOOD, ID_HMAC_SECRET: "tooshort" }).errors.join()).toMatch(/ID_HMAC_SECRET/);
  });

  it("needs https and the same address for the site and the signing links", () => {
    expect(run({ ...GOOD, NEXT_PUBLIC_SERVER_URL: "http://almrkz.vercel.app" }).errors.join()).toMatch(/https/);
    expect(run({ ...GOOD, NEXT_PUBLIC_APP_URL: "https://other.vercel.app" }).errors.join()).toMatch(/نفس العنوان/);
  });

  it("needs media storage, complete S3 keys and a real region for Supabase", () => {
    const noS3 = Object.fromEntries(Object.entries(GOOD).filter(([k]) => !k.startsWith("S3_")));
    expect(run(noS3).errors.join()).toMatch(/تخزين/);
    expect(run({ ...noS3, BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" }).errors).toEqual([]);
    expect(run({ ...GOOD, S3_SECRET_ACCESS_KEY: "" }).errors.join()).toMatch(/S3_SECRET_ACCESS_KEY/);
    expect(run({ ...GOOD, S3_REGION: "auto" }).errors.join()).toMatch(/S3_REGION/);
  });

  it("treats SMTP as all-or-nothing and catches Gmail app passwords with spaces", () => {
    const noMail = Object.fromEntries(Object.entries(GOOD).filter(([k]) => !k.startsWith("SMTP_")));
    const r = run(noMail);
    expect(r.errors).toEqual([]);
    expect(r.warnings.join()).toMatch(/SMTP/);
    expect(run({ ...GOOD, SMTP_PASS: "" }).errors.join()).toMatch(/SMTP_PASS/);
    expect(run({ ...GOOD, SMTP_PASS: "abcd abcd abcd abcd" }).errors.join()).toMatch(/فراغات/);
  });

  it("refuses mock mode and requires the first admin only when the database has none", () => {
    expect(run({ ...GOOD, MOCK_BACKEND: "1" }).errors.join()).toMatch(/MOCK_BACKEND/);
    const noSeed = { ...GOOD, SEED_ADMIN_EMAIL: "", SEED_ADMIN_PASSWORD: "" };
    expect(run(noSeed, { hasAdmin: false }).errors.join()).toMatch(/SEED_ADMIN_EMAIL/);
    expect(run(noSeed, { hasAdmin: true }).errors).toEqual([]);
    expect(run(noSeed, {}).warnings.join()).toMatch(/SEED_ADMIN/);
  });

  it("stops on a database left in Payload's push (dev) mode and warns without CRON_SECRET", () => {
    expect(run(GOOD, { hasAdmin: true, devPush: true }).errors.join()).toMatch(/dev/);
    expect(run({ ...GOOD, CRON_SECRET: "" }, { hasAdmin: true }).warnings.join()).toMatch(/CRON_SECRET/);
  });
});
