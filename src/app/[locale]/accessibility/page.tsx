import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { getSiteData } from "@/lib/data";
import { href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const dict = data.dict(locale);
  return pageMetadata({ siteName: data.site.name, locale, path: "/accessibility", title: dict.accessibility.title, description: dict.accessibility.metaDescription });
}

export default async function AccessibilityPage({ params }: Params) {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const { site } = data;
  const dict = data.dict(locale);
  const a = dict.accessibility;
  return (
    <>
      <PageHero title={a.title}>
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: a.title }]} />
      </PageHero>
      <section className="section">
        <div className="container-x max-w-3xl space-y-5 text-lg leading-relaxed text-ink-soft">
          {a.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="rounded-xl bg-surface p-4 text-base">
            <span dir="ltr">{site.phone}</span> · <a href={`mailto:${site.email}`} dir="ltr" className="font-bold text-brand-700 hover:underline">{site.email}</a>
          </p>
        </div>
      </section>
    </>
  );
}
