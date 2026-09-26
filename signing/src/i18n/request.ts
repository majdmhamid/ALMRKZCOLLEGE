import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Cookie first, then the browser's Accept-Language (Arabic vs Hebrew), then Hebrew. */
export async function resolveLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  const ar = accept.indexOf("ar");
  const he = Math.min(...["he", "iw"].map((c) => accept.indexOf(c)).filter((i) => i >= 0), Infinity);
  if (ar >= 0 && ar < he) return "ar";
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Jerusalem",
  };
});
