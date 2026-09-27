/**
 * Where each document lives on the public website. Shared by the admin panel
 * (preview button + live preview) and the website (links).
 *
 * URL scheme (the website session implements these routes):
 *   /{locale}                         homepage
 *   /{locale}/courses                 all courses
 *   /{locale}/courses/{groupSlug}     a course group
 *   /{locale}/course/{slug}           one course
 *   /{locale}/news/{slug}             news item
 *   /{locale}#graduates               graduate stories (a homepage section; no page of their own)
 */
import type { SiteLocale } from './rules'

export const LOCALES: SiteLocale[] = ['ar', 'he']
export const DEFAULT_LOCALE: SiteLocale = 'ar'

/** Anchor of the homepage section that shows the graduate stories (seed + sections.tsx). */
export const STORIES_ANCHOR = 'graduates'

export type PreviewTarget =
  | {
      collection: 'courses' | 'course-groups' | 'news' | 'success-stories'
      slug?: string | null
      locale?: string
    }
  | { global: string; locale?: string }

export function sitePath(target: PreviewTarget): string {
  const locale =
    target.locale && LOCALES.includes(target.locale as SiteLocale) ? target.locale : DEFAULT_LOCALE
  if ('global' in target) return `/${locale}`
  const slug = target.slug ? encodeURIComponent(target.slug) : ''
  switch (target.collection) {
    case 'courses':
      return `/${locale}/course/${slug}`
    case 'course-groups':
      return `/${locale}/courses/${slug}`
    case 'news':
      return `/${locale}/news/${slug}`
    case 'success-stories':
      // Design Option A shows graduate stories only in a homepage section.
      return `/${locale}#${STORIES_ANCHOR}`
  }
}

/** Public address of the site. On Vercel it is detected automatically. */
export const serverURL = () =>
  (
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000'
  ).replace(/\/$/, '')

/**
 * Link that turns on Next.js draft mode (so unpublished changes are visible)
 * and then opens the page. Only works for someone logged in to /admin.
 * Handled by src/app/(payload)/next/preview/route.ts.
 */
export function previewPath(target: PreviewTarget): string {
  const params = new URLSearchParams({ path: sitePath(target) })
  return `${serverURL()}/next/preview?${params.toString()}`
}
