import type { Metadata } from "next";
import { site } from "@content/site";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";
import LeadForm from "@/components/LeadForm";
import { Breadcrumbs, PageHero } from "@/components/ui";
import { courseOptions, localeParam } from "@/lib/content";
import { getDictionary, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/contact", title: dict.contact.title, description: dict.contact.metaDescription });
}

export default async function ContactPage({ params }: Params) {
  const locale = await localeParam(params);
  const dict = getDictionary(locale);
  const c = dict.contact;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&hl=${locale}&z=15&output=embed`;
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`;

  const rows = [
    { icon: PhoneIcon, label: c.phone, value: site.phone, href: `tel:${site.phoneIntl}`, ltr: true },
    { icon: WhatsAppIcon, label: c.mobile, value: site.mobile, href: site.whatsappUrl, ltr: true },
    { icon: MailIcon, label: c.email, value: site.email, href: `mailto:${site.email}`, ltr: true },
    { icon: PinIcon, label: c.address, value: t(site.address, locale), href: directions },
    { icon: ClockIcon, label: c.hours, value: t(site.hours, locale) },
  ];

  return (
    <>
      <PageHero title={c.title} text={c.intro} image="/images/hero/about.webp">
        <Breadcrumbs className="mt-6 text-ink-soft" items={[{ label: dict.common.breadcrumbHome, to: href(locale) }, { label: c.title }]} />
      </PageHero>

      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          <div data-reveal className="space-y-6 lg:col-span-2">
            <ul className="card divide-y divide-line">
              {rows.map((r) => (
                <li key={r.label} className="flex items-start gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <r.icon width={22} height={22} />
                  </span>
                  <div>
                    <p className="text-sm text-ink-muted">{r.label}</p>
                    {r.href ? (
                      <a href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener" dir={r.ltr ? "ltr" : undefined} className="block font-bold text-ink hover:text-brand-700 hover:underline">
                        {r.value}
                      </a>
                    ) : (
                      <p className="font-bold">{r.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="overflow-hidden rounded-2xl border border-line shadow-card">
              <iframe src={mapSrc} title={c.map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-72 w-full" allowFullScreen />
              <a href={directions} target="_blank" rel="noopener" className="block bg-surface px-4 py-3 text-center text-sm font-bold text-brand-700 hover:underline">
                {c.directions}
              </a>
            </div>
          </div>

          <div id="form" data-reveal="scale" className="card scroll-mt-28 p-6 md:p-8 lg:col-span-3">
            <h2 className="h3">{c.formTitle}</h2>
            <p className="mb-6 mt-1 text-ink-soft">{c.formText}</p>
            <LeadForm locale={locale} dict={dict.form} whatsappLabel={dict.common.whatsappLong} courses={courseOptions(locale)} source="contact" />
          </div>
        </div>
      </section>
    </>
  );
}
