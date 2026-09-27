import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDetail from "@/components/CourseDetail";
import { JsonLd } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { getPublishedSiteData, getSiteData } from "@/lib/data";
import { href, LOCALES, t } from "@/lib/i18n";
import { courseJsonLd, pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; group: string; course: string }> };

export async function generateStaticParams() {
  const { courses } = await getPublishedSiteData();
  return LOCALES.flatMap((locale) => courses.map((c) => ({ locale, group: c.group, course: c.slug })));
}
/** دورات جديدة من لوحة التحكم تُبنى عند أول زيارة */
export const dynamicParams = true;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const { course: slug } = await params;
  const { site, getCourse } = await getSiteData();
  const course = getCourse(slug);
  if (!course) return {};
  return pageMetadata({
    siteName: site.name,
    locale,
    path: `/courses/${course.group}/${course.slug}`,
    title: t(course.name, locale),
    description: `${t(course.summary, locale)} ${course.hours} ${locale === "ar" ? "ساعة" : "שעות"} · ${site.name[locale]}, ${site.city[locale]}.`,
    image: course.image,
  });
}

export default async function CoursePage({ params }: Params) {
  const locale = await localeParam(params);
  const { group: groupSlug, course: slug } = await params;
  const data = await getSiteData();
  const course = data.getCourse(slug);
  const group = data.getGroup(groupSlug);
  if (!course || !group || course.group !== group.slug) notFound();
  const others = data.coursesInGroup(group.slug).filter((c) => c.slug !== course.slug);
  const url = `${data.site.url}${href(locale, `/courses/${group.slug}/${course.slug}`)}`;

  return (
    <>
      <JsonLd data={courseJsonLd(locale, { name: t(course.name, locale), description: t(course.summary, locale), url })} />
      <CourseDetail
        course={course}
        group={group}
        others={others}
        reel={data.reelFor(course.slug, group.slug)}
        site={data.site}
        dict={data.dict(locale)}
        locale={locale}
        courseOptions={data.courseOptions(locale)}
      />
    </>
  );
}
