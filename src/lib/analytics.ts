/**
 * Statistics (Google Analytics 4) and ads measurement (Meta Pixel) — OFF unless the IDs are set
 * in Vercel (docs/إحصائيات-وكوكيز.md). NEXT_PUBLIC_* values are baked in at build time, so the
 * server (privacy page, footer) and the browser always agree.
 *
 * Rules (Israeli Privacy Protection Law + Amendment 13, GDPR-style):
 * - No ID → no banner, no scripts, no cookies.
 * - With an ID → the consent banner asks first; nothing from Google/Meta loads before «موافق».
 * - Events never carry personal data (no names, no phone numbers).
 *
 * This file is shared by server and client code: the functions that touch `window` are only
 * called from event handlers / effects in the browser.
 */

const clean = (v: string | undefined, re: RegExp) => {
  const s = (v ?? '').trim()
  return re.test(s) ? s : ''
}

/** GA4 measurement ID, e.g. G-ABC123XYZ9 (anything else is ignored). */
export const GA_ID = clean(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]{4,20}$/i)
/** Meta Pixel (dataset) ID — digits only. */
export const META_PIXEL_ID = clean(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{5,20}$/)
/** Google Search Console «HTML tag» value (a meta tag only — no cookies, no scripts). */
export const GOOGLE_SITE_VERIFICATION = clean(
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  /^[\w-]{10,100}$/,
)
export const ANALYTICS_ENABLED = Boolean(GA_ID || META_PIXEL_ID)

/** window event that re-opens the banner (footer link «إعدادات الكوكيز»). */
export const CONSENT_OPEN_EVENT = 'almrkz:cookie-settings'

export type ConsentChoice = 'granted' | 'denied'

const STORAGE_KEY = 'almrkz-consent'
/** The choice is remembered for 6 months, then the visitor is asked again. */
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000

export function readConsent(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { c?: unknown; at?: unknown }
    const age = typeof v.at === 'number' ? Date.now() - v.at : NaN
    if ((v.c === 'granted' || v.c === 'denied') && age >= -86_400_000 && age < MAX_AGE_MS)
      return v.c
  } catch {
    // storage blocked (private mode, disabled cookies) → ask again
  }
  return null
}

export function saveConsent(c: ConsentChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ c, at: Date.now() }))
  } catch {
    // not saved → the banner simply shows again next visit
  }
}

type Fn = (...args: unknown[]) => void
type Fbq = Fn & { callMethod?: Fn; queue: unknown[]; push: Fbq; loaded: boolean; version: string }
type W = Window & { dataLayer?: unknown[]; gtag?: Fn; fbq?: Fbq; _fbq?: Fbq }

let granted = false
let defaultsSet = false
let gaStarted = false
let pixelStarted = false

const CONSENT_KEYS = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']
const consentState = (v: 'granted' | 'denied') =>
  Object.fromEntries(CONSENT_KEYS.map((k) => [k, v])) as Record<string, string>

function gtag(...args: unknown[]) {
  const w = window as W
  if (!w.gtag) {
    w.dataLayer = w.dataLayer || []
    // gtag.js needs the `arguments` object itself (not an array) in the dataLayer.
    w.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments)
    }
  }
  w.gtag(...args)
}

/**
 * Google Consent Mode v2: everything denied by default. Only fills the in-page dataLayer —
 * no network request, no cookie (gtag.js itself is loaded only after «موافق»).
 */
export function setConsentDefaults() {
  if (!GA_ID || defaultsSet) return
  defaultsSet = true
  gtag('consent', 'default', consentState('denied'))
}

/** «موافق»: switch consent on and queue the first page view. The component then loads the scripts. */
export function grantConsent() {
  granted = true
  const w = window as W
  if (GA_ID) {
    setConsentDefaults()
    gtag('consent', 'update', consentState('granted'))
    if (!gaStarted) {
      gaStarted = true
      gtag('js', new Date())
      // One page_view per page load. Later client-side route changes are counted by GA4 itself
      // ("page changes based on browser history events", on by default) — so no manual
      // page_view here, which would count them twice.
      gtag('config', GA_ID)
    }
  }
  if (META_PIXEL_ID) {
    if (!w.fbq) {
      // Meta's standard queue stub (the script is added by the component, via next/script).
      const n = function (...args: unknown[]) {
        if (n.callMethod) n.callMethod.call(n, ...args)
        else n.queue.push(args)
      } as Fbq
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []
      w.fbq = n
      if (!w._fbq) w._fbq = n
    }
    if (!pixelStarted) {
      pixelStarted = true
      w.fbq('init', META_PIXEL_ID)
      // Meta also counts client-side route changes on its own (history API).
      w.fbq('track', 'PageView')
    } else {
      w.fbq('consent', 'grant')
    }
  }
}

/** «رفض» (or changed mind later): stop sending and remove the tools' cookies. */
export function revokeConsent() {
  granted = false
  const w = window as W
  if (w.gtag) w.gtag('consent', 'update', consentState('denied'))
  if (w.fbq) w.fbq('consent', 'revoke')
  try {
    const host = window.location.hostname
    const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim()
      if (!/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(name)) continue
      for (const d of domains)
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
    }
  } catch {
    // cookies not accessible — nothing to clean
  }
}

function send(gaEvent: string, gaParams: Record<string, string>, fbEvent: string, fbParams = {}) {
  if (!granted) return
  const w = window as W
  if (GA_ID && w.gtag) w.gtag('event', gaEvent, gaParams)
  if (META_PIXEL_ID && w.fbq) w.fbq('track', fbEvent, fbParams)
}

/** Lead form sent successfully. Only the course name — never the visitor's name or phone. */
export function trackLead(courseName?: string | null) {
  const course = (courseName || '').trim().slice(0, 100) || 'general'
  send('generate_lead', { course_name: course }, 'Lead', { content_name: course })
}

/** Click on a WhatsApp or phone link. */
export function trackContact(method: 'whatsapp' | 'phone') {
  send('contact', { method }, 'Contact', { method })
}
