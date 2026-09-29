import 'server-only'

import type { Metadata } from 'next'

import { pageAlternates } from '@/lib/seo'
import type { SiteLocale } from '@/lib/rules'

import { getShared, mediaUrl } from './data'

/**
 * Metadata of one public page: localized title + description (falling back to the site's SEO
 * settings), its canonical address, the same page in the other language and a share preview.
 * `rest` is the path after the language ('' for the homepage, '/course/x' for a course…).
 */
export async function pageMetadata(
  locale: SiteLocale,
  rest: string,
  page: { title?: string | null; description?: string | null; image?: string } = {},
): Promise<Metadata> {
  const { settings } = await getShared(locale)
  const seo = settings.seo
  const siteTitle = seo?.defaultTitle || settings.siteName || ''
  const title = page.title || undefined
  const description = page.description || seo?.defaultDescription || undefined
  const image = page.image || mediaUrl(seo?.ogImage, 'wide')
  const alternates = pageAlternates(locale, rest)
  return {
    ...(title ? { title } : {}),
    description,
    alternates,
    openGraph: {
      type: 'website',
      siteName: settings.siteName ?? undefined,
      title: title || siteTitle,
      description,
      url: alternates.canonical,
      locale: locale === 'he' ? 'he_IL' : 'ar_AR',
      alternateLocale: locale === 'he' ? 'ar_AR' : 'he_IL',
      images: image ? [image] : undefined,
    },
  }
}
