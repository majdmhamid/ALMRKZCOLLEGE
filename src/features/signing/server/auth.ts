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

/**
 * المدير الحالي، أو null. بس صلاحية «مدير» — «محرّر» (محتوى الموقع بس) ما بيشوف المستندات:
 * فيها أرقام هويات وتواقيع الطلاب.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return null;
  const u = user as { id: number | string; email?: string; name?: string; roles?: string[] | null };
  if (!u.roles?.includes("admin")) return null;
  const admin = { userId: payloadUserUuid(u.id), email: u.email ?? "", displayName: u.name || u.email || "" };
  await ensureProfile(admin.userId, admin.displayName);
  return admin;
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  // Not logged in → the login page; logged in as an editor → Payload sends them on to /admin.
  if (!admin) redirect("/admin/login");
  return admin;
}
