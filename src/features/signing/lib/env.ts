import "server-only";
import { z } from "zod";

import { isMockBackend } from "@/lib/backend-mode";

/**
 * Server environment. Mock mode (MOCK_BACKEND=1, or local dev without Supabase) runs
 * the app with an on-disk fake backend — for local UI work and screenshots only.
 */
export { isMockBackend };

/** Where mock mode keeps its database and files (MOCK_DATA_DIR overrides; tests use a temp dir). */
export function mockDataDir(): string {
  return process.env.MOCK_DATA_DIR || `${process.cwd()}/.mock-data`;
}

const b64Key = z
  .string()
  .refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64-encoded");

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ID_HMAC_SECRET: z.string().min(32),
  TOKEN_ENC_KEY: b64Key,
  SESSION_SECRET: z.string().min(32),
});

// Fixed, obviously-fake values so mock mode works without any setup.
const MOCK_DEFAULTS = {
  NEXT_PUBLIC_APP_URL: `http://localhost:${process.env.PORT || 3000}`,
  NEXT_PUBLIC_SUPABASE_URL: "http://mock.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key-not-real",
  ID_HMAC_SECRET: "mock-id-hmac-secret-000000000000000000",
  TOKEN_ENC_KEY: Buffer.alloc(32, 7).toString("base64"),
  SESSION_SECRET: "mock-session-secret-0000000000000000000",
} satisfies z.input<typeof schema>;

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const source = isMockBackend ? { ...MOCK_DEFAULTS, ...pickDefined(process.env) } : process.env;
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Missing or invalid environment variables (see .env.example): ${fields}`);
  }
  cached = parsed.data;
  return cached;
}

function pickDefined(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""),
  );
}

/** Public base URL for building signing links. */
export function appUrl(): string {
  return serverEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
}
