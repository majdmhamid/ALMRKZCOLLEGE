import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DocumentsView } from "@/components/documents/DocumentsView";
import { adminContext } from "@/server/context";
import { documentStats, listCategories, listDocuments } from "@/server/repo/documents";
import { recentNotifications, unreadCount } from "@/server/repo/notifications";
import { getSettings } from "@/server/repo/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("documents"))("title") };
}

export default async function DocumentsPage() {
  const { db } = await adminContext();
  const [docs, stats, unread, notifications, categories, settings] = await Promise.all([
    listDocuments(db, "active"),
    documentStats(db),
    unreadCount(db),
    recentNotifications(db),
    listCategories(db),
    getSettings(db),
  ]);

  return (
    <DocumentsView
      section="active"
      docs={docs}
      stats={stats}
      unread={unread}
      notifications={notifications}
      categories={categories}
      defaultLinkMode={settings.default_link_mode}
    />
  );
}
