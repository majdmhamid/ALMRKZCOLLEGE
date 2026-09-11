import { coursesInGroup } from "@content/courses";
import { groups } from "@content/groups";
import { isLocale, t, type Locale } from "./i18n";

export const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

/** المجموعات مع دوراتها بأسماء اللغة المطلوبة — للقوائم */
export const navGroups = (locale: Locale) =>
  sortedGroups.map((g) => ({
    slug: g.slug,
    name: t(g.name, locale),
    courses: coursesInGroup(g.slug).map((c) => ({ slug: c.slug, name: t(c.name, locale) })),
  }));

/** خيارات قائمة "الدورة" في الاستمارة */
export const courseOptions = (locale: Locale) =>
  sortedGroups.flatMap((g) => coursesInGroup(g.slug).map((c) => ({ value: c.slug, label: t(c.name, locale) })));

/** يقرأ اللغة من params الصفحة (Next.js يمرّرها كـ Promise) */
export async function localeParam(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : "ar";
}
