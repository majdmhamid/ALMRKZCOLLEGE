import "server-only";
import { requireAdmin, type AdminUser } from "@/features/signing/server/auth";
import { getDb, type Db } from "@/features/signing/server/db";
import { requestInfo } from "@/features/signing/server/request-info";

export type AdminContext = { db: Db; admin: AdminUser; ip: string | null; userAgent: string | null };

/** Everything an admin action needs. Redirects to /login when not an admin. */
export async function adminContext(): Promise<AdminContext> {
  const admin = await requireAdmin();
  const [db, info] = await Promise.all([getDb(), requestInfo()]);
  return { db, admin, ip: info.ip, userAgent: info.userAgent };
}
