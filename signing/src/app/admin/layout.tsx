import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LiveUpdates } from "@/components/LiveUpdates";
import { MockBanner } from "@/components/MockBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { isMockBackend } from "@/lib/env";
import { requireAdmin } from "@/server/auth";
import { logoutAction } from "../login/actions";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <MockBanner />
      <LiveUpdates mode={isMockBackend ? "mock" : "supabase"} />
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="border-line bg-card lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-e">
          <div className="flex h-full flex-col gap-4 p-3 lg:p-4">
            <div className="flex items-center justify-between gap-2 lg:block">
              <div className="flex items-center gap-2.5 px-1">
                <span className="grid size-9 place-items-center rounded-xl bg-ink text-white" aria-hidden>
                  ✍
                </span>
                <span className="font-semibold">{t("app.name")}</span>
              </div>
              <form action={logoutAction} className="lg:hidden">
                <button className="rounded-lg px-2 py-1 text-sm text-muted hover:text-ink">{t("nav.logout")}</button>
              </form>
            </div>
            <AdminNav />
            <div className="mt-auto hidden space-y-3 lg:block">
              <LanguageSwitch />
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <div className="font-medium">{admin.displayName || admin.email}</div>
                <div className="ltr-nums truncate text-xs text-muted">{admin.email}</div>
                <form action={logoutAction}>
                  <button className="mt-2 text-xs font-medium text-muted hover:text-ink">{t("nav.logout")}</button>
                </form>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
