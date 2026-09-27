import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/features/signing/lib/database.types";
import { serverEnv } from "@/features/signing/lib/env";

/** Supabase client acting as the signed-in admin (anon key + auth cookies). */
export async function createSupabaseAuthClient() {
  const env = serverEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes them.
        }
      },
    },
  });
}

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
