import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { isWellFormedToken } from "@/lib/security/crypto";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("sign"))("title"), referrer: "no-referrer" };
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("sign");
  const valid = isWellFormedToken(token);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-5">
      <div className="mb-6 flex justify-end">
        <LanguageSwitch />
      </div>
      <div className="rounded-2xl border border-line bg-card p-6 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-bold">{t("title")}</h1>
        <p className="text-muted">{valid ? t("comingSoon") : t("invalidLink")}</p>
      </div>
    </main>
  );
}
