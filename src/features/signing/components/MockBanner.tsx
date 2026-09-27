import { getTranslations } from "next-intl/server";
import { isMockBackend } from "@/features/signing/lib/env";

export async function MockBanner() {
  if (!isMockBackend) return null;
  const t = await getTranslations("common");
  return (
    <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">{t("mockBanner")}</div>
  );
}
