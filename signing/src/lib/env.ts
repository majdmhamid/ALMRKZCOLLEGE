import "server-only";
import { z } from "zod";

/**
 * Server environment. MOCK_BACKEND=1 runs the app with an in-memory/on-disk fake
 * backend (no Supabase) — for local UI work and screenshots only.
 */
export const isMockBackend = process.env.MOCK_BACKEND === "1";

const b64Key = z
  .string()
  .refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64-encoded");

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ID_HMAC_SECRET: z.string().min(32),
  TOKEN_ENC_KEY: b64Key,
  SESSION_SECRET: z.string().min(32),
});

// Fixed, obviously-fake values so mock mode works without any setup.
const MOCK_DEFAULTS = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3100",
  NEXT_PUBLIC_SUPABASE_URL: "http://mock.invalid",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key-not-a-real-key",
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
