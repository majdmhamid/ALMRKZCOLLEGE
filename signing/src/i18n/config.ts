export const locales = ["he", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

const rtlLocales: readonly Locale[] = ["he", "ar"];

/** Both current languages are right-to-left. */
export function dirOf(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

export const localeNames: Record<Locale, string> = { he: "עברית", ar: "العربية" };
