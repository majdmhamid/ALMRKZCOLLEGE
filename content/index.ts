import { courseNames, courses, dayCourses, groups, startDates } from "./courses";
import { dict, homeCopy } from "./i18n";
import { gallery, news, promo, reels } from "./media";
import { graduates, partners, staff } from "./people";
import { site, waHref } from "./site";
import type { Locale } from "./types";

export * from "./types";
export { site, telHref, waHref } from "./site";
export { showStartDates } from "./courses";
export { hero, promo } from "./media";

const dateLocale: Record<Locale, string> = { he: "he-IL", ar: "ar-SY" };

/** Everything a page needs for one language, flattened to plain strings. */
export function forLocale(lang: Locale) {
  const d = dict[lang];
  const x = homeCopy[lang];
  const groupName = (slug: string) => groups.find((g) => g.slug === slug)!.name[lang];
  const fmtStart = (iso: string) =>
    iso === "weekly" ? x.weekly : new Date(iso).toLocaleDateString(dateLocale[lang], { day: "numeric", month: "long", timeZone: "UTC" });

  const localCourses = courses.map((c) => ({ ...c, name: c.name[lang], summary: c.summary[lang], groupName: groupName(c.group) }));

  // Sorted by next intake; weekly courses go last.
  const courseRows = localCourses
    .map((c) => {
      const iso = startDates[c.slug] ?? "weekly";
      return { ...c, iso, startLabel: fmtStart(iso), timeLabel: dayCourses[c.slug] ?? d.common.evening, wa: waHref(x.detailMsg + c.name) };
    })
    .sort((a, b) => (a.iso === "weekly" ? 1 : b.iso === "weekly" ? -1 : a.iso.localeCompare(b.iso)));

  const nextFor = (slug: string) => courseRows.find((c) => c.group === slug && c.iso !== "weekly")?.startLabel ?? x.weekly;

  return {
    lang,
    d,
    x,
    site: { ...site, name: site.name[lang], shortName: site.shortName[lang], city: site.city[lang], address: site.address[lang], hours: site.hours[lang] },
    groups: groups.map((g) => ({ ...g, name: g.name[lang], short: g.short[lang], tagline: g.tagline[lang], countLabel: `${g.count} ${d.common.courseCount}`, nextLabel: nextFor(g.slug) })),
    courses: localCourses,
    courseRows,
    graduates: graduates.map((g) => ({ ...g, name: g.name[lang], courseName: courseNames[g.course][lang] })),
    staff: staff.map((s) => ({ ...s, name: s.name[lang], role: s.role[lang] })),
    partners: partners.map((p) => ({ ...p, name: p.name[lang] })),
    news: news.map((n) => ({
      ...n,
      title: n.title[lang],
      excerpt: n.excerpt[lang],
      dateLabel: new Date(n.date).toLocaleDateString(lang === "he" ? "he-IL" : "ar-EG", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
    })),
    gallery,
    promo,
    reels: reels.map((r) => {
      const c = localCourses.find((k) => k.slug === r.course)!;
      return { ...r, title: x.reels[r.id], groupName: c.groupName, href: waHref(x.detailMsg + c.name) };
    }),
    // FAQ order for this page: funding and schedule first.
    faq: [d.faq[1], d.faq[2], d.faq[0], ...d.faq.slice(3)],
    menuLinks: [
      { href: "#fields", label: d.nav.courses },
      { href: "#funding", label: d.trust[3].title },
      { href: "#graduates", label: d.nav.graduates },
      { href: "#why", label: d.nav.about },
      { href: "#video", label: d.nav.gallery },
      { href: "#news", label: d.nav.news },
      { href: "#employers", label: d.nav.employers },
    ],
  };
}

export type Content = ReturnType<typeof forLocale>;
