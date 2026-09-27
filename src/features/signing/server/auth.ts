import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isMockBackend, serverEnv } from "@/features/signing/lib/env";
import { signPayload, verifyPayload } from "@/features/signing/lib/security/session";
import { createSupabaseAuthClient, supabaseService } from "@/features/signing/lib/supabase/server";

export type AdminUser = { userId: string; email: string; displayName: string };

const MOCK_SESSION_COOKIE = "mock_admin_session";
export const MOCK_ADMIN_ID = "00000000-0000-4000-8000-000000000001";

/**
 * The signed-in admin, or null. "Admin" = a Supabase Auth user who ALSO has an
 * admin_profiles row — a valid login alone is not enough.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  if (isMockBackend) {
    const session = verifyPayload<{ email: string }>(
      (await cookies()).get(MOCK_SESSION_COOKIE)?.value,
      serverEnv().SESSION_SECRET,
    );
    return session ? { userId: MOCK_ADMIN_ID, email: session.email, displayName: process.env.MOCK_ADMIN_NAME || "مجد" } : null;
  }

  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabaseService()
    .from("admin_profiles")
    .select("display_name")
    .eq("user_id", data.user.id)
    .maybeSingle<{ display_name: string }>();
  if (!profile) return null;

  return { userId: data.user.id, email: data.user.email ?? "", displayName: profile.display_name };
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export type SignInResult = "ok" | "invalid" | "not_admin";

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (isMockBackend) {
    const expectedEmail = process.env.MOCK_ADMIN_EMAIL || "admin@example.test";
    const expectedPassword = process.env.MOCK_ADMIN_PASSWORD || "mock-password";
    if (email.toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) return "invalid";
    (await cookies()).set(MOCK_SESSION_COOKIE, signPayload({ email }, serverEnv().SESSION_SECRET, 60 * 60 * 12), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return "ok";
  }

  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return "invalid";

  const { data: profile } = await supabaseService()
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return "not_admin";
  }
  return "ok";
}

export async function signOut(): Promise<void> {
  if (isMockBackend) {
    (await cookies()).delete(MOCK_SESSION_COOKIE);
    return;
  }
  const supabase = await createSupabaseAuthClient();
  await supabase.auth.signOut();
}

/** Cookie name exported for the proxy's cheap "is anyone logged in" check. */
export { MOCK_SESSION_COOKIE };
