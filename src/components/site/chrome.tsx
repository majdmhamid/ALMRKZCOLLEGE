import React from 'react'

import type { SiteLocale } from '@/lib/rules'

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

type Props = { shared: Shared; locale: SiteLocale }

export function Header({ shared, locale }: Props) {
  const { navigation, ui, settings } = shared
  const items = navigation.header?.items ?? []
  const links = items.map((i) => ({ href: linkHref(i.link, locale, shared), label: i.label }))
  const cta = navigation.header?.cta
  const ctaHref = cta ? linkHref(cta.link, locale, shared) : `/${locale}#register`
  const logo = mediaUrl(settings.logoLight)
  return (
    <header className="header">
      <div className="glass header-bar">
        <a href={`/${locale}`} className="header-logo">
          {logo ? (
            <img src={logo} alt={settings.siteName ?? ''} {...mediaDims(settings.logoLight)} />
          ) : (
            <b>{settings.siteName}</b>
          )}
        </a>
        <nav className="header-nav show-desktop">
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
          />
        </div>
      </div>
    </header>
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
                aria-label={s.platform}
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
            {contact?.whatsapp && (
              <a href={whatsappHref(shared)} target="_blank" rel="noopener" aria-label="WhatsApp">
                <SocialIcon platform="whatsapp" />
              </a>
            )}
          </div>
        </div>
        {(footer?.columns ?? []).map((col) => (
          <div key={col.id ?? col.title}>
            <h3>{col.title}</h3>
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
          {footer?.contactTitle && <h3>{footer.contactTitle}</h3>}
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
          <span style={{ display: 'flex', gap: 14 }}>
            {(footer?.bottomLinks ?? []).map((l) => (
              <a key={l.id ?? l.label} href={linkHref(l.link, locale, shared)}>
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
      <nav className="glass tabbar">
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
      <a
        href={whatsappHref(shared)}
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        className="wa-float ring show-desktop"
      >
        <WhatsAppIcon size={30} />
      </a>
    </>
  )
}
