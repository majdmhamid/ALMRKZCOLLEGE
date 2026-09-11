import type { MetadataRoute } from "next";
import { courses } from "@content/courses";
import { groups } from "@content/groups";
import { news } from "@content/news";
import { site } from "@content/site";
import { LOCALES } from "@/lib/i18n";

/** خريطة الموقع لجوجل — كل صفحة باللغتين مع ربط hreflang */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/courses", "/about", "/graduates", "/gallery", "/news", "/employers", "/contact", "/accessibility"];
  const paths = [
    ...staticPaths,
    ...groups.map((g) => `/courses/${g.slug}`),
    ...courses.map((c) => `/courses/${c.group}/${c.slug}`),
    ...news.map((n) => `/news/${n.slug}`),
  ];
  const now = new Date();
  return paths.flatMap((p) =>
    LOCALES.map((locale) => ({
      url: `${site.url}/${locale}${p}`,
      lastModified: now,
      changeFrequency: p === "" ? "weekly" : "monthly",
      priority: p === "" ? 1 : p.startsWith("/courses") ? 0.8 : 0.6,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${site.url}/${l}${p}`])) },
    })),
  );
}
