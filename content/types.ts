export const locales = ["he", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "he";

/** A string in both site languages. */
export type L10n = Record<Locale, string>;

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}
