import "server-only";
import config from "@payload-config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { MOCK_ADMIN_ID, payloadUserUuid } from "@/features/signing/server/admin-id";
import { getDb } from "@/features/signing/server/db";

export type AdminUser = { userId: string; email: string; displayName: string };

/**
 * التوقيع الإلكتروني بيستعمل نفس حساب لوحة التحكم (مستخدمي Payload).
 * منتأكد إن للمدير صف بـ admin_profiles (الاسم اللي بيطلع بالسجل وعلى التوقيع).
 */
export { MOCK_ADMIN_ID, payloadUserUuid };

const ensured = new Set<string>();

async function ensureProfile(userId: string, displayName: string) {
  if (ensured.has(userId)) return;
  const db = await getDb();
  await db.query(
    `insert into public.admin_profiles (user_id, display_name) values ($1, $2)
       on conflict (user_id) do update set display_name = excluded.display_name`,
    [userId, displayName],
  );
  ensured.add(userId);
}

type PanelUser = { id: number | string; email?: string; name?: string; roles?: string[] | null };

/** التوقيع الإلكتروني للمدراء بس (صلاحية «مدير»). «المحرّر» ما بيشوفه ولا بيقدر يستعمله. */
export const isSigningAdmin = (user: unknown) => Boolean((user as PanelUser | null)?.roles?.includes("admin"));

/** المستخدم الداخل على لوحة التحكم (مدير أو محرّر)، أو null */
const getPanelUser = cache(async (): Promise<PanelUser | null> => {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  return (user as PanelUser | null) ?? null;
});

/** المدير الحالي (مستخدم لوحة التحكم بصلاحية «مدير»)، أو null */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const u = await getPanelUser();
  if (!u || !isSigningAdmin(u)) return null;
  const admin = { userId: payloadUserUuid(u.id), email: u.email ?? "", displayName: u.name || u.email || "" };
  await ensureProfile(admin.userId, admin.displayName);
  return admin;
});

/** مش داخل ← صفحة الدخول. داخل بس مش مدير (محرّر) ← رئيسية اللوحة. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (admin) return admin;
  redirect((await getPanelUser()) ? "/admin" : "/admin/login");
}
