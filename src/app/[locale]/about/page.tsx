import type { Metadata } from "next";
import Image from "next/image";
import { PartnerBadge, StaffCard } from "@/components/cards";
import { AwardIcon, CheckIcon, ShieldIcon } from "@/components/Icons";
import { Breadcrumbs, CtaBand, PageHero, SectionHeading, delay } from "@/components/ui";
import { localeParam } from "@/lib/content";
import { getSiteData } from "@/lib/data";
import { href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const dict = data.dict(locale);
  return pageMetadata({ siteName: data.site.name, locale, path: "/about", title: dict.about.title, description: dict.about.metaDescription, image: "/images/hero/about.webp" });
}

export default async function AboutPage({ params }: Params) {
  const locale = await localeParam(params);
  const data = await getSiteData();
  const { site, gallery, partners, staff } = data;
  const dict = data.dict(locale);
  const a = dict.about;
  const facilityImages = [gallery.find((g) => g.category === "welding"), gallery.find((g) => g.category === "hvac"), gallery.find((g) => g.category === "events")].filter(Boolean);

  return (
    <>
      <PageHero title={a.title} text={a.intro} image="/images/hero/about.webp" eyebrow={dict.hero.badge}>
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: a.title }]} />
      </PageHero>

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-3">
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft lg:col-span-2">
            {a.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="space-y-4">
            <div className="card flex items-center gap-4 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <AwardIcon width={30} height={30} />
              </span>
              <div>
                <p className="text-3xl font-extrabold text-brand-700">{site.foundedYear}</p>
                <p className="text-sm text-ink-soft">{dict.trust[0].text}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <ShieldIcon width={30} height={30} />
              </span>
              <div>
                <p className="text-lg font-extrabold">{dict.trust[1].title}</p>
                <p className="text-sm text-ink-soft">{dict.trust[1].text}</p>
              </div>
            </div>
            <Image src="/images/partners/ministry-of-labor.png" alt={t(partners[0]?.name, locale)} width={160} height={160} className="mx-auto h-28 w-auto" />
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading title={a.whyTitle} center />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {a.whyItems.map((item, i) => (
              <div key={item.title} data-reveal style={delay(i * 80)} className="card card-hover p-6">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
                  <CheckIcon />
                </span>
                <h3 className="text-lg font-extrabold">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading title={a.facilitiesTitle} text={a.facilitiesText} />
          <div className="grid grid-cols-3 gap-4">
            {facilityImages.map((img) => (
              <div key={img!.src} data-reveal="scale" className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
                <Image src={img!.src} alt={t(img!.alt, locale)} fill sizes="33vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-x">
          <SectionHeading title={a.staffTitle} text={a.staffSubtitle} center />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {staff.map((s, i) => (
              <StaffCard key={s.slug} name={t(s.name, locale)} role={t(s.role, locale)} image={s.image} style={delay(i * 80)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading title={a.partnersTitle} center />
          <div className="flex flex-wrap items-center justify-center gap-8">
            {partners.map((p) => (
              <PartnerBadge key={p.slug} name={t(p.name, locale)} image={p.image} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand locale={locale} title={dict.home.ctaTitle} text={dict.home.ctaText} primary={dict.common.registerInterest} whatsapp={dict.common.whatsappLong} whatsappUrl={site.whatsappUrl} />
    </>
  );
}
