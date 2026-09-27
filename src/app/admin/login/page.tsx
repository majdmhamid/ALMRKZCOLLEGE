import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isMockBackend } from "@/lib/backend-mode";
import { isAdmin } from "@/lib/cms/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "دخول" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  // بوضع التجربة على جهاز التطوير: البيانات الوهمية معبّاة سلفاً
  const demo = isMockBackend ? { email: process.env.MOCK_ADMIN_EMAIL || "admin@example.test", password: process.env.MOCK_ADMIN_PASSWORD || "mock-password" } : undefined;
  return (
    <main className="bg-glow flex min-h-screen items-center justify-center p-4">
      <div className="card admin-pop w-full max-w-sm p-8 text-center shadow-lift">
        <Image src="/images/brand/logo.png" alt="كلية المركز" width={88} height={88} className="mx-auto h-20 w-20 object-contain" priority />
        <h1 className="mt-4 text-2xl font-extrabold">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-ink-soft">محتوى الموقع والتوقيع الإلكتروني</p>
        {demo && <p className="mt-4 rounded-xl bg-amber-50 p-2.5 text-xs font-bold text-amber-800">وضع تجريبي على هذا الجهاز — بيانات الدخول معبّاة.</p>}
        <LoginForm demo={demo} />
      </div>
    </main>
  );
}
