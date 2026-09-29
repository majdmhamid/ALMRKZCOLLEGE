import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getAllNews, getShared, isLocale } from '@/components/site/data'
import { NewsListPage } from '@/components/site/extra-pages'
import { PAGE_TEXT } from '@/components/site/page-text'
import { pageMetadata } from '@/components/site/seo'

export const revalidate = 60

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { ui } = await getShared(locale)
  return pageMetadata(locale, '/news', { title: ui.nav?.news || PAGE_TEXT[locale].news })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [shared, news] = await Promise.all([getShared(locale), getAllNews(locale)])
  return <NewsListPage news={news} shared={shared} locale={locale} />
}
