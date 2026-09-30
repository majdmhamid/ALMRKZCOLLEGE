import type { SiteLocale } from '@/lib/rules'

/**
 * The legal pages (texts in legal.tsx). Kept in a tiny file of their own because the footer,
 * the «سجّل اهتمامك» form and the signing page link to them on every page.
 */
export type LegalSlug = 'accessibility' | 'privacy' | 'terms'

export const LEGAL_SLUGS: LegalSlug[] = ['accessibility', 'privacy', 'terms']

/**
 * Last time each page's text was reviewed (YYYY-MM-DD) — shown on the page and in the sitemap.
 * Change it whenever the text in legal.tsx changes.
 */
export const LEGAL_UPDATED: Record<LegalSlug, string> = {
  accessibility: '2026-09-29',
  privacy: '2026-09-30',
  terms: '2026-09-30',
}

export const legalHref = (locale: string, slug: LegalSlug) => `/${locale}/${slug}`

/** Names of the pages (footer links, page titles, the note under the lead form). */
export const LEGAL_LABELS: Record<SiteLocale, Record<LegalSlug, string>> = {
  ar: { accessibility: 'إعلان الوصولية', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام' },
  he: { accessibility: 'הצהרת נגישות', privacy: 'מדיניות פרטיות', terms: 'תקנון האתר' },
}

/** Footer links to the legal pages, always shown (the accessibility statement is required by law). */
export const legalLinks = (locale: SiteLocale) =>
  LEGAL_SLUGS.map((slug) => ({ href: legalHref(locale, slug), label: LEGAL_LABELS[locale][slug] }))
