import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("documents"))("title") };
}

export default async function DocumentsPage() {
  const t = await getTranslations("documents");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">{t("comingSoon")}</div>
    </>
  );
}
