import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/features/signing/lib/database.types";
import { serverEnv } from "@/features/signing/lib/env";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client — bypasses RLS. SERVER ONLY. Every caller must have
 * already checked who is asking (requireAdmin / a verified signing token).
 */
export function supabaseService() {
  if (!serviceClient) {
    const env = serverEnv();
    serviceClient = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return serviceClient;
}
