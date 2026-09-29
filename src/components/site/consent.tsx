'use client'

import Script from 'next/script'
import React, { useEffect, useRef, useState } from 'react'

import {
  CONSENT_OPEN_EVENT,
  type ConsentChoice,
  GA_ID,
  META_PIXEL_ID,
  grantConsent,
  readConsent,
  revokeConsent,
  saveConsent,
  setConsentDefaults,
  trackContact,
} from '@/lib/analytics'

/**
 * Cookie-consent banner + the Google/Meta scripts. Mounted only when an analytics ID is set
 * (see analytics.tsx). Renders nothing on the server and nothing until the browser is idle, so
 * pages stay static and the first screen is not delayed. Nothing third-party loads before «موافق».
 */

const tools = [GA_ID && 'Google Analytics', META_PIXEL_ID && 'Meta'].filter((x): x is string =>
  Boolean(x),
)

const TEXT = {
  ar: {
    label: 'إعدادات الكوكيز',
    before: 'نودّ استعمال كوكيز للإحصاء ولقياس الإعلانات عبر',
    and: ' و',
    after: '، لنعرف كيف يُستعمل الموقع ونحسّنه. لن نفعّلها إلا إذا وافقت.',
    accept: 'موافق',
    reject: 'رفض',
    more: 'التفاصيل',
  },
  he: {
    label: 'הגדרות עוגיות',
    before: 'נשמח להשתמש בעוגיות לסטטיסטיקה ולמדידת פרסום באמצעות',
    and: ' ו-',
    after: ', כדי להבין איך משתמשים באתר ולשפר אותו. הן יופעלו רק אם תאשרו.',
    accept: 'אישור',
    reject: 'דחייה',
    more: 'פרטים נוספים',
  },
}

const t = (locale: string) => (locale === 'he' ? TEXT.he : TEXT.ar)

function onIdle(cb: () => void) {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(cb, { timeout: 4000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(cb, 1500)
  return () => clearTimeout(id)
}

export function ConsentManager({ locale }: { locale: string }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  /** Where keyboard focus goes back to after the visitor re-opened the banner and chose. */
  const back = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setConsentDefaults()
    // Wait until the page is idle: the banner / the scripts never compete with the first screen.
    let cancel: (() => void) | undefined = onIdle(() => {
      cancel = undefined
      const stored = readConsent()
      if (!stored) return setOpen(true)
      if (stored === 'granted') grantConsent()
      setChoice(stored)
    })
    const reopen = () => {
      cancel?.()
      back.current = document.activeElement as HTMLElement | null
      setOpen(true)
    }
    // WhatsApp / phone clicks (sent only after consent — trackContact checks it).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]')
      const href = a?.getAttribute('href') || ''
      if (href.startsWith('tel:')) trackContact('phone')
      else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) trackContact('whatsapp')
    }
    window.addEventListener(CONSENT_OPEN_EVENT, reopen)
    document.addEventListener('click', onClick, true)
    return () => {
      cancel?.()
      window.removeEventListener(CONSENT_OPEN_EVENT, reopen)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  // Re-opened from the footer link: keyboard focus moves into the banner (and back on choice).
  useEffect(() => {
    if (open && back.current) box.current?.querySelector('button')?.focus()
  }, [open])

  const decide = (c: ConsentChoice) => {
    saveConsent(c)
    if (c === 'granted') grantConsent()
    else revokeConsent()
    setChoice(c)
    setOpen(false)
    back.current?.focus?.()
    back.current = null
  }

  const s = t(locale)
  return (
    <>
      {open && (
        <div ref={box} className="consent" role="region" aria-label={s.label} aria-live="polite">
          <p>
            {s.before}{' '}
            {/* <bdi>: the English names inside Arabic/Hebrew text stay in the right order. */}
            {tools.map((name, i) => (
              <React.Fragment key={name}>
                {i > 0 && s.and}
                <bdi>{name}</bdi>
              </React.Fragment>
            ))}
            {s.after} <a href={`/${locale === 'he' ? 'he' : 'ar'}/privacy#cookies`}>{s.more}</a>
          </p>
          <div className="consent-actions">
            <button type="button" className="consent-btn" onClick={() => decide('granted')}>
              {s.accept}
            </button>
            <button type="button" className="consent-btn" onClick={() => decide('denied')}>
              {s.reject}
            </button>
          </div>
        </div>
      )}
      {choice === 'granted' && GA_ID && (
        <Script
          id="gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
      )}
      {choice === 'granted' && META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="afterInteractive"
        />
      )}
    </>
  )
}

/** Footer link «إعدادات الكوكيز» / «הגדרות עוגיות» — re-opens the banner to change the choice. */
export function CookieSettingsButton({ locale }: { locale: string }) {
  return (
    <button
      type="button"
      className="link-btn"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      {t(locale).label}
    </button>
  )
}
