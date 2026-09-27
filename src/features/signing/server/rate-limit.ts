import "server-only";
import { isMockBackend } from "@/features/signing/lib/env";
import { supabaseService } from "@/features/signing/lib/supabase/server";

const memory = new Map<string, { windowStart: number; hits: number }>();

/**
 * Fixed-window rate limit. Returns true when the request may proceed.
 * Backed by Postgres (public.rate_limit_hit) so it holds across serverless instances.
 */
export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  if (isMockBackend) {
    const windowStart = Math.floor(Date.now() / 1000 / windowSeconds);
    const entry = memory.get(key);
    const hits = entry && entry.windowStart === windowStart ? entry.hits + 1 : 1;
    memory.set(key, { windowStart, hits });
    return hits <= max;
  }
  const { data, error } = await supabaseService().rpc("rate_limit_hit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) throw new Error(`rate limit check failed: ${error.message}`);
  return data === true;
}
