import { isLocale, type Locale } from "./i18n";

/** يقرأ اللغة من params الصفحة (Next.js يمرّرها كـ Promise) */
export async function localeParam(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : "ar";
}
