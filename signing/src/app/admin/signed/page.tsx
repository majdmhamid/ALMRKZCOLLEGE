import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("signedPage"))("title") };
}

export default async function SignedPage() {
  const t = await getTranslations("signedPage");
  return <PageHeader title={t("title")} subtitle={t("subtitle")} />;
}
