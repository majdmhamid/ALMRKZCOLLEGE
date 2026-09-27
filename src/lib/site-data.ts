/**
 * أدوات قراءة المحتوى (الدورات حسب المجموعة، الخبر حسب الرابط، نصوص اللغة...).
 * دالة نقية: تشتغل على الخادم للموقع، وفي المتصفح للمعاينة الحيّة داخل لوحة التحكم.
 */
import type { Dictionary } from "@content/i18n";
import type { Locale } from "@content/types";
import type { SiteContent, SiteInfo } from "@/lib/cms/schema";
import { courseCount, t } from "@/lib/i18n";

/** الرابط النهائي للموقع — من الإعدادات وليس من لوحة التحكم */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.almrkz.net";

export type Site = SiteInfo & { url: string };

export function buildSiteData(content: SiteContent) {
  const site: Site = { ...content.site, url: SITE_URL };
  const sortedGroups = [...content.groups].sort((a, b) => a.order - b.order);
  const courses = content.courses;
  const coursesInGroup = (group: string) => courses.filter((c) => c.group === group).sort((a, b) => a.order - b.order);
  /** كل الدورات مرتّبة: حسب المجموعة ثم حسب الترتيب داخلها */
  const orderedCourses = sortedGroups.flatMap((g) => coursesInGroup(g.slug));
  const news = [...content.news].sort((a, b) => b.date.localeCompare(a.date));

  const dict = (locale: Locale): Dictionary => content.texts[locale] ?? content.texts.ar;

  return {
    content,
    site,
    dict,
    groups: sortedGroups,
    sortedGroups,
    courses: orderedCourses,
    news,
    graduates: content.graduates,
    staff: content.staff,
    partners: content.partners,
    gallery: content.gallery,
    galleryCategories: content.galleryCategories,
    videos: content.videos,
    reels: content.reels,
    promoVideo: content.promoVideo,

    getGroup: (slug: string) => sortedGroups.find((g) => g.slug === slug),
    getCourse: (slug: string) => courses.find((c) => c.slug === slug),
    coursesInGroup,
    featuredCourses: () => orderedCourses.filter((c) => c.featured),
    getPost: (slug: string) => news.find((p) => p.slug === slug),
    /** الريل المناسب لصفحة دورة: حسب الدورة أولاً ثم حسب المجموعة */
    reelFor: (course: string, group: string) => content.reels.find((r) => r.course === course) ?? content.reels.find((r) => r.group === group && !r.course),

    /** المجموعات مع دوراتها بأسماء اللغة المطلوبة — للقوائم */
    navGroups: (locale: Locale) =>
      sortedGroups.map((g) => {
        const list = coursesInGroup(g.slug);
        return {
          slug: g.slug,
          name: t(g.name, locale),
          tagline: t(g.tagline, locale),
          image: g.image,
          count: courseCount(locale, list.length),
          courses: list.map((c) => ({ slug: c.slug, name: t(c.name, locale) })),
        };
      }),

    /** خيارات قائمة "الدورة" في الاستمارة */
    courseOptions: (locale: Locale) => orderedCourses.map((c) => ({ value: c.slug, label: t(c.name, locale) })),
  };
}

export type SiteData = ReturnType<typeof buildSiteData>;
