import { DEFAULT_LOCALE, LOCALES, type Locale, type Localized } from "@content/types";
import { getDictionary } from "@content/i18n";

export { LOCALES, DEFAULT_LOCALE, getDictionary };
export type { Locale };

export const isLocale = (value: string): value is Locale => (LOCALES as string[]).includes(value);

/** يرجّع النص باللغة المطلوبة، ويرجع للعربي إذا كان ناقصاً */
export const t = (value: Localized | undefined, locale: Locale): string => (value ? value[locale] || value[DEFAULT_LOCALE] : "");

export const otherLocale = (locale: Locale): Locale => (locale === "ar" ? "he" : "ar");

/** يبني رابطاً داخلياً مع بادئة اللغة: href('ar', '/courses') → '/ar/courses' */
export const href = (locale: Locale, path = "/"): string => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
};

/** يبدّل بادئة اللغة في المسار الحالي: '/ar/courses/x' → '/he/courses/x' */
export const switchLocalePath = (pathname: string, to: Locale): string => {
  const parts = pathname.split("/");
  if (parts.length > 1 && isLocale(parts[1])) {
    parts[1] = to;
    return parts.join("/") || `/${to}`;
  }
  return `/${to}${pathname === "/" ? "" : pathname}`;
};

/** "3 دورات" / "3 קורסים" */
export const courseCount = (locale: Locale, n: number): string =>
  locale === "ar" ? (n === 1 ? "دورة واحدة" : n === 2 ? "دورتان" : `${n} دورات`) : n === 1 ? "קורס אחד" : `${n} קורסים`;

export const ogLocale = (locale: Locale) => (locale === "ar" ? "ar_IL" : "he_IL");

/** تنسيق التاريخ للعرض (أرقام غربية بكلتا اللغتين) */
export const formatDate = (iso: string, locale: Locale): string => {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
};
