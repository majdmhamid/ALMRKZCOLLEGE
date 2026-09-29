import React from 'react'

import type { News } from '@/payload-types'
import type { SiteLocale } from '@/lib/rules'

import { MapEmbed } from './client'
import { type Shared, type getHomeData, mediaUrl, telHref, whatsappHref } from './data'
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from './icons'
import { PAGE_TEXT } from './page-text'
import { PageHero } from './pages'
import { HomeSections, NewTab, NewsCard, RegisterForm } from './sections'

type Home = Awaited<ReturnType<typeof getHomeData>>

/*
 * The About, Contact and News pages. They have no content of their own in the admin panel:
 * they show what is already there (معلومات الكلية, the homepage sections, the news items),
 * so editing it once updates the homepage and these pages together.
 */

/**
 * Address of the embedded Google map. Accepts what editors paste in «رابط تضمين الخريطة»
 * (the src="…" link, or the whole <iframe> code); without it, a map searched by the address.
 * Only Google Maps is embedded — anything else is ignored.
 */
export function mapEmbedSrc(shared: Shared): string | undefined {
  const c = shared.settings.contact
  const raw = c?.mapEmbedUrl?.trim()
  const pasted = raw?.match(/src=["']([^"']+)["']/)?.[1] ?? raw
  if (pasted && /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(pasted)) return pasted
  const q = [c?.address, shared.settings.city].filter(Boolean).join(', ')
  return q ? `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed` : undefined
}

/** Link that opens the college on Google Maps / Waze (the setting, or a search by address). */
function mapLink(shared: Shared): string | undefined {
  const c = shared.settings.contact
  if (c?.mapUrl) return c.mapUrl
  const q = [c?.address, shared.settings.city].filter(Boolean).join(', ')
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : undefined
}

const heroImage = (shared: Shared) =>
  mediaUrl(shared.settings.seo?.ogImage, 'hero') || mediaUrl(shared.groups[0]?.image, 'hero')

export function ContactPage({ shared, locale }: { shared: Shared; locale: SiteLocale }) {
  const t = PAGE_TEXT[locale]
  const ui = shared.ui
  const c = shared.settings.contact
  const phones = c?.phones ?? []
  const map = mapEmbedSrc(shared)
  const link = mapLink(shared)
  return (
    <>
      <PageHero
        locale={locale}
        image={heroImage(shared)}
        crumbs={[{ href: `/${locale}`, label: ui.nav?.home }]}
        title={ui.nav?.contact || t.contact}
        sub={shared.settings.tagline}
      />
      <div className="detail">
        <div>
          <section className="card glass">
            <ul className="contact-list">
              {c?.address && (
                <li>
                  <PinIcon color="#158942" />
                  <div>
                    <span>{t.address}</span>
                    <b>{c.address}</b>
                    {link && (
                      <a href={link} target="_blank" rel="noopener" className="more">
                        {t.openMap}
                        <NewTab locale={locale} />
                      </a>
                    )}
                  </div>
                </li>
              )}
              {phones.map((p) => (
                <li key={p.id ?? p.number}>
                  <PhoneIcon color="#158942" />
                  <div>
                    <span>{p.label || t.phones}</span>
                    <a href={telHref(p.number)} dir="ltr">
                      <b>{p.number}</b>
                    </a>
                  </div>
                </li>
              ))}
              {c?.whatsapp && (
                <li>
                  <WhatsAppIcon size={22} color="#25d366" />
                  <div>
                    <span>{t.whatsapp}</span>
                    <a href={whatsappHref(shared)} target="_blank" rel="noopener">
                      <b>{ui.common?.whatsappLong || t.whatsapp}</b>
                      <NewTab locale={locale} />
                    </a>
                  </div>
                </li>
              )}
              {c?.email && (
                <li>
                  <MailIcon color="#158942" />
                  <div>
                    <span>{t.email}</span>
                    <a href={`mailto:${c.email}`} dir="ltr" style={{ wordBreak: 'break-all' }}>
                      <b>{c.email}</b>
                    </a>
                  </div>
                </li>
              )}
            </ul>
          </section>
          {!!c?.openingHours?.length && (
            <section className="card glass">
              <h2>{t.hours}</h2>
              <ul className="facts-list">
                {c.openingHours.map((h) => (
                  <li key={h.id ?? h.days}>
                    <span>{h.days}</span>
                    <b>{h.hours}</b>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {map && (
            <section className="card glass">
              <MapEmbed src={map} title={t.mapTitle} showLabel={t.showMap} />
            </section>
          )}
        </div>
        <aside className="sticky-side">
          <a
            href={whatsappHref(shared)}
            target="_blank"
            rel="noopener"
            className="btn btn-wa"
            style={{ height: 54, borderRadius: 16 }}
          >
            <WhatsAppIcon />
            {ui.common?.whatsappLong}
            <NewTab locale={locale} />
          </a>
          <section className="card glass" id="register">
            <h2>{ui.common?.registerInterest || t.writeUs}</h2>
            <RegisterForm shared={shared} locale={locale} source={`/${locale}/contact`} />
          </section>
        </aside>
      </div>
    </>
  )
}

/** Homepage sections that tell who the college is — reused on the About page. */
const ABOUT_SECTIONS = new Set(['why', 'staff', 'partners', 'gallery', 'successStories'])

export function AboutPage({
  shared,
  home,
  locale,
}: {
  shared: Shared
  home: Home
  locale: SiteLocale
}) {
  const t = PAGE_TEXT[locale]
  const s = shared.settings
  const about = shared.navigation.footer?.about
  const years = s.foundedYear ? new Date().getFullYear() - s.foundedYear : 0
  const facts = [
    [years, t.years],
    [shared.courses.length, t.courses],
    [shared.groups.length, t.groups],
  ].filter(([n]) => Number(n) > 0) as [number, string][]
  const sections = (home.homepage.sections ?? []).filter((b) => ABOUT_SECTIONS.has(b.blockType))
  return (
    <>
      <PageHero
        locale={locale}
        image={heroImage(shared)}
        crumbs={[{ href: `/${locale}`, label: shared.ui.nav?.home }]}
        title={shared.ui.nav?.about || t.about}
        sub={s.accreditation || s.tagline}
      />
      <div className="wrap" style={{ padding: '40px 20px 8px' }}>
        <section className="card glass about-intro">
          <h2>{s.siteName}</h2>
          {about && <p className="prose">{about}</p>}
          {s.foundedYear && (
            <p className="note" style={{ marginTop: 14 }}>
              {t.founded} <span dir="ltr">{s.foundedYear}</span>
              {s.city ? ` · ${s.city}` : ''}
            </p>
          )}
          {facts.length > 0 && (
            <div className="about-facts">
              {facts.map(([n, label]) => (
                <div key={label}>
                  <b dir="ltr">{n}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <HomeSections
        shared={shared}
        home={{ ...home, homepage: { ...home.homepage, sections } }}
        locale={locale}
      />
    </>
  )
}

export function NewsListPage({
  news,
  shared,
  locale,
}: {
  news: News[]
  shared: Shared
  locale: SiteLocale
}) {
  const t = PAGE_TEXT[locale]
  return (
    <>
      <PageHero
        locale={locale}
        image={mediaUrl(news[0]?.coverImage, 'hero') || heroImage(shared)}
        crumbs={[{ href: `/${locale}`, label: shared.ui.nav?.home }]}
        title={shared.ui.nav?.news || t.news}
      />
      <div className="wrap" style={{ padding: '40px 20px 56px' }}>
        {/* Heading for screen readers: the news cards below are h3. */}
        <h2 className="sr-only">{t.allNews}</h2>
        {news.length ? (
          <div className="news-grid">
            {news.map((x, i) => (
              <NewsCard key={x.id} x={x} shared={shared} locale={locale} i={i % 6} />
            ))}
          </div>
        ) : (
          <p className="card glass prose" style={{ textAlign: 'center' }}>
            {t.noNews}
          </p>
        )}
      </div>
    </>
  )
}
