import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getBySlug, getShared, isLocale, mediaUrl } from '@/components/site/data'
import { CoursePage } from '@/components/site/pages'
import type { SiteLocale } from '@/lib/rules'

export const revalidate = 60

type Props = { params: Promise<{ locale: string; slug: string }> }

const load = (locale: SiteLocale, slug: string) => getBySlug('courses', locale, slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const c = await load(locale, slug)
  if (!c) return {}
  const img = mediaUrl(c.seo?.image, 'wide') || mediaUrl(c.coverImage, 'wide')
  return {
    title: c.seo?.title || c.name,
    description: c.seo?.description || c.shortDescription,
    openGraph: img ? { images: [img] } : undefined,
    alternates: { languages: { ar: `/ar/course/${c.slug}`, he: `/he/course/${c.slug}` } },
  }
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const [shared, c] = await Promise.all([getShared(locale), load(locale, slug)])
  if (!c) notFound()
  return <CoursePage c={c} shared={shared} locale={locale} />
}
