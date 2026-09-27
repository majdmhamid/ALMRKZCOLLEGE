import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * لغة نصوص التوقيع:
 *  - لوحة التحكم (/admin): عربي دائماً (لغة مجد وحسين).
 *  - صفحة التوقيع للعميل (/sign): الكوكي ← لغة المتصفح (عربي/عبري) ← عبري.
 * المنطقة بيعلّمها proxy.ts بالعنوان x-app-area.
 */
export async function resolveLocale(): Promise<Locale> {
  const h = await headers();
  const jar = await cookies();
  if (h.get("x-app-area") !== "sign") {
    // لغة اللوحة: عربي. (كوكي admin_locale للاختبارات الآلية بالعبري فقط — ما في زر بيغيّره)
    const forced = jar.get("admin_locale")?.value;
    return isLocale(forced) ? forced : "ar";
  }
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = h.get("accept-language")?.toLowerCase() ?? "";
  const ar = accept.indexOf("ar");
  const he = Math.min(...["he", "iw"].map((c) => accept.indexOf(c)).filter((i) => i >= 0), Infinity);
  if (ar >= 0 && ar < he) return "ar";
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Jerusalem",
  };
});
