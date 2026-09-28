import "server-only";
import { isMockBackend } from "@/features/signing/lib/env";
import { getDb } from "@/features/signing/server/db";

const memory = new Map<string, { windowStart: number; hits: number }>();

/**
 * Fixed-window rate limit. Returns true when the request may proceed.
 * Backed by Postgres (public.rate_limit_hit) so it holds across serverless instances.
 * Called over the app's own database connection (not Supabase's REST API), so it needs no
 * extra round trip and keeps working with Supabase's Data API turned off.
 */
export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  if (isMockBackend) {
    const windowStart = Math.floor(Date.now() / 1000 / windowSeconds);
    const entry = memory.get(key);
    const hits = entry && entry.windowStart === windowStart ? entry.hits + 1 : 1;
    memory.set(key, { windowStart, hits });
    return hits <= max;
  }
  const db = await getDb();
  const [row] = await db.query<{ ok: boolean }>("select public.rate_limit_hit($1, $2, $3) as ok", [
    key,
    windowSeconds,
    max,
  ]);
  return row?.ok === true;
}
