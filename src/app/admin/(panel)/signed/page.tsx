import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DocumentsView } from "@/features/signing/components/documents/DocumentsView";
import { adminContext } from "@/features/signing/server/context";
import { documentStats, listCategories, listDocuments } from "@/features/signing/server/repo/documents";
import { recentNotifications, unreadCount } from "@/features/signing/server/repo/notifications";
import { getSettings } from "@/features/signing/server/repo/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("signedPage"))("title") };
}

/** Same month → day layout as Documents; only documents moved here by hand. */
export default async function SignedPage() {
  const { db } = await adminContext();
  const [docs, stats, unread, notifications, categories, settings] = await Promise.all([
    listDocuments(db, "signed"),
    documentStats(db),
    unreadCount(db),
    recentNotifications(db),
    listCategories(db),
    getSettings(db),
  ]);

  return (
    <DocumentsView
      section="signed"
      docs={docs}
      stats={stats}
      unread={unread}
      notifications={notifications}
      categories={categories}
      defaultLinkMode={settings.default_link_mode}
    />
  );
}
