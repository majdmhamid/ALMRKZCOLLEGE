/**
 * Addresses for search engines: the canonical address of a page and the same page in the
 * other language (hreflang). Used by every public page's metadata and by /sitemap.xml.
 */
import { DEFAULT_LOCALE, LOCALES, serverURL } from './preview'
import type { SiteLocale } from './rules'

/** Full address (https://…) of a path on the public site. */
export const absoluteUrl = (path: string) =>
  `${serverURL()}${path.startsWith('/') ? '' : '/'}${path}`

/** A slug inside a URL (Arabic/Hebrew letters are percent-encoded, as search engines expect). */
export const encodeSlug = (slug: string | null | undefined) => encodeURIComponent(slug ?? '')

/**
 * `rest` is the part after the language, e.g. '' (homepage), '/courses', '/course/welding'.
 * Returns the address of that page in each language + x-default (the Arabic version).
 */
export function languageUrls(rest: string): Record<SiteLocale | 'x-default', string> {
  const urls = Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(`/${l}${rest}`)])) as Record<
    SiteLocale,
    string
  >
  return { ...urls, 'x-default': urls[DEFAULT_LOCALE] }
}

/** `alternates` for Next.js metadata: canonical = this language, plus ar / he / x-default. */
export function pageAlternates(locale: SiteLocale, rest: string) {
  const languages = languageUrls(rest)
  return { canonical: languages[locale], languages }
}
