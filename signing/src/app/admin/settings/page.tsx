import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settingsPage"))("title") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settingsPage");
  return <PageHeader title={t("title")} />;
}
