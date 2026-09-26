import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getBySlug, getShared, isLocale } from '@/components/site/data'
import { NewsPage } from '@/components/site/pages'
import type { SiteLocale } from '@/lib/rules'

export const revalidate = 60

type Props = { params: Promise<{ locale: string; slug: string }> }

const load = (locale: SiteLocale, slug: string) => getBySlug('news', locale, slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const n = await load(locale, slug)
  return n ? { title: n.seo?.title || n.title, description: n.seo?.description || n.excerpt } : {}
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const [shared, n] = await Promise.all([getShared(locale), load(locale, slug)])
  if (!n) notFound()
  return <NewsPage n={n} shared={shared} locale={locale} />
}
