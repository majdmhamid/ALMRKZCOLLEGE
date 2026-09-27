import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/features/signing/components/PageHeader";
import { adminContext } from "@/features/signing/server/context";
import { getSettings } from "@/features/signing/server/repo/settings";
import { getSavedSignature } from "@/features/signing/server/services/admin";
import { SettingsForm } from "./SettingsForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settingsPage"))("title") };
}

export default async function SettingsPage() {
  const ctx = await adminContext();
  const t = await getTranslations("settingsPage");
  const [settings, saved] = await Promise.all([getSettings(ctx.db), getSavedSignature(ctx)]);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsForm initial={settings} savedSignatureUrl={saved?.url ?? null} />
    </>
  );
}
