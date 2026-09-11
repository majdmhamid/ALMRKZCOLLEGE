import type { Metadata } from "next";
import { news } from "@content/news";
import { Breadcrumbs, CtaBand, NewsCard, PageHero, delay } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { getDictionary, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/news", title: dict.news.title, description: dict.news.metaDescription });
}

export default async function NewsPage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return (
    <>
      <PageHero title={dict.news.title} text={dict.news.intro} image="/images/news/certificates-ceremony-2026/2.webp">
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: dict.news.title }]} />
      </PageHero>
      <section className="section">
        <div className="container-x grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((p, i) => (
            <NewsCard key={p.slug} post={p} locale={locale} readMore={dict.common.readMore} style={delay((i % 3) * 100)} />
          ))}
        </div>
      </section>
      <CtaBand locale={locale} title={dict.home.ctaTitle} text={dict.home.ctaText} primary={dict.common.registerInterest} whatsapp={dict.common.whatsappLong} />
    </>
  );
}
