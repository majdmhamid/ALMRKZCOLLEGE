import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { LiveUpdates } from "@/features/signing/components/LiveUpdates";
import { ToastProvider } from "@/features/signing/components/ui/Toast";
import { requireAdmin } from "@/features/signing/server/auth";
import { getDb } from "@/features/signing/server/db";
import type { DocumentStats } from "@/features/signing/lib/domain";
import { documentStats } from "@/features/signing/server/repo/documents";
import { unreadCount } from "@/features/signing/server/repo/notifications";
import { isMockBackend } from "@/lib/backend-mode";
import { loadDraft, loadPublished } from "@/lib/cms/draft";
import { cmsStore } from "@/lib/cms/store";
import AdminShell from "../_components/AdminShell";
import { AdminProvider } from "../_lib/store";

export const dynamic = "force-dynamic";

/** لوحة واحدة: محتوى الموقع + التوقيع الإلكتروني، بنفس الدخول ونفس الشكل */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const [draft, published, store, signing] = await Promise.all([
    loadDraft(),
    loadPublished(),
    cmsStore(),
    getDb()
      .then(async (db) => ({ ...(await documentStats(db)), unread: await unreadCount(db) }))
      .catch((e): (DocumentStats & { unread: number }) | null => (console.error("[admin] signing stats", e), null)),
  ]);
  return (
    <NextIntlClientProvider>
      <AdminProvider
        initialDraft={draft.content}
        initialVersion={draft.version}
        initialSavedAt={draft.updatedAt}
        published={published.content}
        publishedAt={published.publishedAt}
        demo={isMockBackend}
        storeKind={store.kind}
        adminName={admin.displayName || admin.email}
        signingStats={signing}
      >
        <LiveUpdates mode={isMockBackend ? "mock" : "supabase"} />
        <AdminShell>
          <ToastProvider>{children}</ToastProvider>
        </AdminShell>
      </AdminProvider>
    </NextIntlClientProvider>
  );
}
