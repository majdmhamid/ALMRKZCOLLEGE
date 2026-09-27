import type { Metadata } from "next";
import { GraduateCard } from "@/components/cards";
import { Breadcrumbs, CtaBand, PageHero, delay } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { getSiteData } from "@/lib/data";
import { href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const dict = data.dict(locale);
  return pageMetadata({ siteName: data.site.name, locale, path: "/graduates", title: dict.graduates.title, description: dict.graduates.metaDescription });
}

export default async function GraduatesPage({ params }: Params) {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const dict = data.dict(locale);

  return (
    <>
      <PageHero title={dict.graduates.title} text={dict.graduates.intro} image="/images/news/certificates-ceremony-2026/1.webp">
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.graduates.title }]} />
      </PageHero>

      <section className="section">
        <div className="container-x grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {data.graduates.map((g, i) => {
            const course = data.getCourse(g.course);
            return (
              <GraduateCard
                key={g.slug}
                name={t(g.name, locale)}
                image={g.image}
                courseName={course && t(course.name, locale)}
                courseHref={course && href(locale, `/courses/${course.group}/${course.slug}`)}
                graduateOfLabel={dict.graduates.graduateOf}
                style={delay((i % 4) * 90)}
              />
            );
          })}
        </div>
      </section>

      <CtaBand locale={locale} title={dict.graduates.joinTitle} text={dict.home.ctaText} primary={dict.common.registerInterest} whatsapp={dict.common.whatsappLong} whatsappUrl={data.site.whatsappUrl} />
    </>
  );
}
