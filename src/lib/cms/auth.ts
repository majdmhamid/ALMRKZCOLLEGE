import "server-only";
import { getAdmin, requireAdmin as requireSigningAdmin } from "@/features/signing/server/auth";

/**
 * دخول لوحة التحكم — نفس حساب التوقيع الإلكتروني:
 * مستخدم Supabase إله صف بجدول admin_profiles (بوضع التجربة: MOCK_ADMIN_EMAIL / MOCK_ADMIN_PASSWORD).
 */
export async function isAdmin(): Promise<boolean> {
  return !!(await getAdmin());
}

export const requireAdmin = requireSigningAdmin;

/** للاستعمال داخل Server Actions: يرمي خطأ بدل التحويل */
export async function assertAdmin() {
  if (!(await getAdmin())) throw new Error("unauthorized");
}
