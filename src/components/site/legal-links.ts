import type { SiteLocale } from '@/lib/rules'

/**
 * The two legal pages (texts in legal.tsx). Kept in a tiny file of their own because the footer
 * and the «سجّل اهتمامك» form link to them on every page.
 */
export type LegalSlug = 'accessibility' | 'privacy'

export const LEGAL_SLUGS: LegalSlug[] = ['accessibility', 'privacy']

/**
 * Last time each page's text was reviewed (YYYY-MM-DD) — shown on the page and in the sitemap.
 * Change it whenever the text in legal.tsx changes.
 */
export const LEGAL_UPDATED: Record<LegalSlug, string> = {
  accessibility: '2026-09-28',
  privacy: '2026-09-28',
}

export const legalHref = (locale: string, slug: LegalSlug) => `/${locale}/${slug}`

/** Names of the two pages (footer links, page titles, the note under the lead form). */
export const LEGAL_LABELS: Record<SiteLocale, Record<LegalSlug, string>> = {
  ar: { accessibility: 'إعلان الوصولية', privacy: 'سياسة الخصوصية' },
  he: { accessibility: 'הצהרת נגישות', privacy: 'מדיניות פרטיות' },
}

/** Footer links to both pages, always shown (the accessibility statement is required by law). */
export const legalLinks = (locale: SiteLocale) =>
  LEGAL_SLUGS.map((slug) => ({ href: legalHref(locale, slug), label: LEGAL_LABELS[locale][slug] }))
