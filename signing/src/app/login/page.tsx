import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { MockBanner } from "@/components/MockBanner";
import { getAdmin } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("title") };
}

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin/documents");
  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <MockBanner />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-ink text-lg text-white" aria-hidden>
                ✍
              </span>
              <span className="font-semibold">{t("app.name")}</span>
            </div>
            <LanguageSwitch />
          </div>
          <div className="rounded-2xl border border-line bg-card p-6 shadow-sm">
            <h1 className="mb-5 text-xl font-bold">{t("login.title")}</h1>
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
