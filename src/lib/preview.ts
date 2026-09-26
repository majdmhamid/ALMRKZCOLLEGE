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
 *   /{locale}/success-stories/{slug}  graduate story
 */
import type { SiteLocale } from './rules'

export const LOCALES: SiteLocale[] = ['ar', 'he']
export const DEFAULT_LOCALE: SiteLocale = 'ar'

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
      return `/${locale}/success-stories/${slug}`
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
