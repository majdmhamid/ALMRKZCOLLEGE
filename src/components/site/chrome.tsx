import React from 'react'

import type { SiteLocale } from '@/lib/rules'

import { A11Y, SOCIAL_NAMES } from './a11y-text'
import { HeaderMenu, LangSwitch } from './client'
import {
  type Shared,
  isExternal,
  linkHref,
  mediaDims,
  mediaUrl,
  telHref,
  whatsappHref,
} from './data'
import {
  HomeIcon,
  LayersIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  SocialIcon,
  WhatsAppIcon,
} from './icons'
import { legalLinks } from './legal-links'

type Props = { shared: Shared; locale: SiteLocale }

/** «facebook.com» for a social link whose platform is «other». */
const hostName = (url?: string | null) => {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '')
  } catch {
    return url ?? ''
  }
}

export function Header({ shared, locale }: Props) {
  const { navigation, ui, settings } = shared
  const items = navigation.header?.items ?? []
  const links = items.map((i) => ({ href: linkHref(i.link, locale, shared), label: i.label }))
  const cta = navigation.header?.cta
  const ctaHref = cta ? linkHref(cta.link, locale, shared) : `/${locale}#register`
  const logo = mediaUrl(settings.logoLight)
  const a11y = A11Y[locale]
  return (
    <>
      {/* First thing a keyboard user reaches; appears only when it gets focus. */}
      <a href="#top" className="skip-link">
        {a11y.skip}
      </a>
      <header className="header">
        <div className="glass header-bar">
          <a href={`/${locale}`} className="header-logo">
            {logo ? (
              <img src={logo} alt={settings.siteName ?? ''} {...mediaDims(settings.logoLight)} />
            ) : (
              <b>{settings.siteName}</b>
            )}
          </a>
          <nav className="header-nav show-desktop" aria-label={a11y.mainNav}>
            {links.map((l, i) => (
              <a key={i} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <LangSwitch locale={locale} label={ui.otherLang} />
            {cta?.show !== false && (
              <a href={ctaHref} className="btn btn-green header-cta show-desktop">
                {cta?.label ?? ui.common?.registerInterest}
              </a>
            )}
            <HeaderMenu
              links={links}
              registerHref={ctaHref}
              registerLabel={cta?.label ?? ui.common?.registerInterest ?? ''}
              whatsappHref={whatsappHref(shared)}
              whatsappLabel={ui.common?.whatsapp ?? ''}
              menuLabel={ui.nav?.menu ?? ''}
              navLabel={a11y.mainNav}
            />
          </div>
        </div>
      </header>
    </>
  )
}

export function Footer({ shared, locale }: Props) {
  const { navigation, settings } = shared
  const footer = navigation.footer
  const contact = settings.contact
  const logo = mediaUrl(settings.logoDark)
  const year = String(new Date().getFullYear())
  const phones = contact?.phones ?? []
  const office = phones[0]
  const bottomLinks = (footer?.bottomLinks ?? []).map((l) => ({
    key: l.id ?? l.label,
    href: linkHref(l.link, locale, shared),
    label: l.label,
  }))
  // Accessibility statement + privacy policy are always linked, even if the menu in the admin
  // panel does not have them (older databases pointed «إعلان الوصولية» to #contact).
  for (const l of legalLinks(locale)) {
    if (!bottomLinks.some((b) => b.href === l.href)) bottomLinks.push({ key: l.href, ...l })
  }
  return (
    <footer className="footer" id="contact">
      <div className="footer-grid">
        <div>
          {logo && (
            <img
              src={logo}
              alt={settings.siteName ?? ''}
              {...mediaDims(settings.logoDark)}
              loading="lazy"
              decoding="async"
              style={{ height: 48, width: 'auto' }}
            />
          )}
          {footer?.about && <p className="footer-about">{footer.about}</p>}
          <div className="socials">
            {(settings.social ?? []).map((s) => (
              <a
                key={s.id ?? s.url}
                href={s.url}
                target="_blank"
                rel="noopener"
                aria-label={`${SOCIAL_NAMES[s.platform] ?? hostName(s.url)} (${A11Y[locale].newTab})`}
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
            {contact?.whatsapp && (
              <a
                href={whatsappHref(shared)}
                target="_blank"
                rel="noopener"
                aria-label={`WhatsApp (${A11Y[locale].newTab})`}
              >
                <SocialIcon platform="whatsapp" />
              </a>
            )}
          </div>
        </div>
        {(footer?.columns ?? []).map((col) => (
          <div key={col.id ?? col.title}>
            <h2>{col.title}</h2>
            <ul>
              {(col.links ?? []).map((l) => {
                const href = linkHref(l.link, locale, shared)
                return (
                  <li key={l.id ?? l.label}>
                    <a
                      href={href}
                      {...(isExternal(href) ? { target: '_blank', rel: 'noopener' } : {})}
                    >
                      {l.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        <div>
          {footer?.contactTitle && <h2>{footer.contactTitle}</h2>}
          <ul className="contact">
            {contact?.address && (
              <li>
                <PinIcon color="#88bb3c" style={{ flexShrink: 0, marginTop: 2 }} />
                {contact.address}
              </li>
            )}
            {office && (
              <li style={{ alignItems: 'center' }}>
                <PhoneIcon color="#88bb3c" style={{ flexShrink: 0 }} />
                <a href={telHref(office.number)} dir="ltr">
                  {office.number}
                </a>
              </li>
            )}
            {contact?.whatsapp && (
              <li style={{ alignItems: 'center' }}>
                <WhatsAppIcon size={18} color="#88bb3c" style={{ flexShrink: 0 }} />
                <a href={whatsappHref(shared)} dir="ltr">
                  {phones[1]?.number ?? contact.whatsapp}
                </a>
              </li>
            )}
            {contact?.email && (
              <li style={{ alignItems: 'center' }}>
                <MailIcon color="#88bb3c" style={{ flexShrink: 0 }} />
                <a href={`mailto:${contact.email}`} dir="ltr" style={{ wordBreak: 'break-all' }}>
                  {contact.email}
                </a>
              </li>
            )}
            {(contact?.openingHours ?? []).map((h) => (
              <li key={h.id ?? h.days} style={{ color: 'rgba(255,255,255,.7)' }}>
                {h.days}
                {h.hours ? ` · ${h.hours}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div>
          <span>{(footer?.copyright ?? '').replace('{year}', year)}</span>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {bottomLinks.map((l) => (
              <a key={l.key} href={l.href}>
                {l.label}
              </a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  )
}

export function MobileBar({ shared, locale }: Props) {
  const { ui, settings } = shared
  const phone = settings.contact?.phones?.[0]?.number
  return (
    <>
      <div className="tabbar-space" aria-hidden="true" />
      <nav className="glass tabbar" aria-label={A11Y[locale].quickNav}>
        <a href={`/${locale}#top`}>
          <HomeIcon />
          {ui.nav?.home}
        </a>
        <a href={`/${locale}#fields`}>
          <LayersIcon />
          {ui.nav?.courses}
        </a>
        <a href={`/${locale}#register`} className="main">
          {ui.common?.registerInterest}
        </a>
        <a href={whatsappHref(shared)} target="_blank" rel="noopener">
          <WhatsAppIcon size={24} color="#25d366" />
          {ui.common?.whatsapp}
        </a>
        <a href={telHref(phone)}>
          <PhoneIcon size={22} color="#158942" />
          {ui.common?.call}
        </a>
      </nav>
      <aside aria-label={A11Y[locale].contact}>
        <a
          href={whatsappHref(shared)}
          target="_blank"
          rel="noopener"
          aria-label={`WhatsApp (${A11Y[locale].newTab})`}
          className="wa-float ring show-desktop"
        >
          <WhatsAppIcon size={30} />
        </a>
      </aside>
    </>
  )
}
