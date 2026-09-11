import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { coursesInGroup } from "@content/courses";
import { ArrowIcon } from "@/components/Icons";
import { Breadcrumbs, CourseCard, CtaBand, PageHero } from "@/components/ui";
import { localeParam, sortedGroups } from "@/lib/content";
import { courseCount, getDictionary, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/courses", title: dict.courses.title, description: dict.courses.metaDescription });
}

export default async function CoursesPage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const labels = { hours: dict.common.hours, sessions: dict.common.sessions, view: dict.common.viewCourse };

  return (
    <>
      <PageHero title={dict.courses.title} text={dict.courses.subtitle} image="/images/groups/welding.webp">
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.courses.title }]} />
        <div className="mt-6 flex flex-wrap gap-2">
          {sortedGroups.map((g) => (
            <a key={g.slug} href={`#${g.slug}`} className="chip hover:bg-brand-50">
              {t(g.name, locale)} · {courseCount(locale, coursesInGroup(g.slug).length)}
            </a>
          ))}
        </div>
      </PageHero>

      {sortedGroups.map((g, i) => (
        <section key={g.slug} id={g.slug} className={`section ${i % 2 ? "bg-surface" : ""}`}>
          <div className="container-x">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 p-2.5">
                <Image src={g.icon} alt="" width={44} height={44} />
              </span>
              <div className="flex-1">
                <h2 className="h2">{t(g.name, locale)}</h2>
                <p className="text-ink-soft">{t(g.tagline, locale)}</p>
              </div>
              <Link href={href(locale, `/courses/${g.slug}`)} className="btn btn-outline btn-sm">
                {dict.common.readMore}
                <ArrowIcon width={16} height={16} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coursesInGroup(g.slug).map((c) => (
                <CourseCard key={c.slug} course={c} locale={locale} labels={labels} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <CtaBand locale={locale} title={dict.home.ctaTitle} text={dict.home.ctaText} primary={dict.common.registerInterest} whatsapp={dict.common.whatsappLong} />
    </>
  );
}
