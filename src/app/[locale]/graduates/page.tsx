import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCourse } from "@content/courses";
import { graduates } from "@content/people";
import { Breadcrumbs, CtaBand, PageHero, delay } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { getDictionary, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/graduates", title: dict.graduates.title, description: dict.graduates.metaDescription });
}

export default async function GraduatesPage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero title={dict.graduates.title} text={dict.graduates.intro} image="/images/news/certificates-ceremony-2026/1.webp">
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.graduates.title }]} />
      </PageHero>

      <section className="section">
        <div className="container-x grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {graduates.map((g, i) => {
            const course = getCourse(g.course);
            return (
              <article key={g.slug} data-reveal style={delay((i % 4) * 90)} className="card card-hover overflow-hidden">
                <div className="relative aspect-[3/4]">
                  <Image src={g.image} alt={t(g.name, locale)} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <h2 className="font-extrabold">{t(g.name, locale)}</h2>
                  {course && (
                    <p className="mt-1 text-sm leading-snug text-ink-soft">
                      {dict.graduates.graduateOf}{" "}
                      <Link href={href(locale, `/courses/${course.group}/${course.slug}`)} className="text-brand-700 hover:underline">
                        {t(course.name, locale)}
                      </Link>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <CtaBand locale={locale} title={dict.graduates.joinTitle} text={dict.home.ctaText} primary={dict.common.registerInterest} whatsapp={dict.common.whatsappLong} />
    </>
  );
}
