import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { coursesInGroup } from "@content/courses";
import { getGroup, groups } from "@content/groups";
import { Breadcrumbs, CourseCard, CtaBand, PageHero } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { courseCount, getDictionary, href, LOCALES, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string; group: string }> };

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) => groups.map((g) => ({ locale, group: g.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const { group: slug } = await params;
  const group = getGroup(slug);
  if (!group) return {};
  return pageMetadata({ locale, path: `/courses/${group.slug}`, title: t(group.name, locale), description: t(group.description, locale), image: group.image });
}

export default async function GroupPage({ params }: Params) {
  const locale = await localeParam(params);
  const { group: slug } = await params;
  const group = getGroup(slug);
  if (!group) notFound();
  const dict = getDictionary(locale);
  const list = coursesInGroup(group.slug);

  return (
    <>
      <PageHero title={t(group.name, locale)} text={t(group.tagline, locale)} image={group.image} eyebrow={courseCount(locale, list.length)}>
        <Breadcrumbs className="mt-6 text-white/80" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.courses.title, to: href(locale, "/courses") }, { label: t(group.name, locale) }]} />
      </PageHero>

      <section className="section">
        <div className="container-x">
          <p className="lead mb-10 max-w-3xl">{t(group.description, locale)}</p>
          <h2 className="h3 mb-6">{dict.courses.groupCoursesTitle}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <CourseCard key={c.slug} course={c} locale={locale} labels={{ hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse }} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand locale={locale} title={dict.home.ctaTitle} text={dict.home.ctaText} primary={dict.common.registerInterest} whatsapp={dict.common.whatsappLong} />
    </>
  );
}
