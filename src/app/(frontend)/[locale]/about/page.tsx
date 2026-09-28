import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getHomeData, getShared, isLocale } from '@/components/site/data'
import { AboutPage } from '@/components/site/extra-pages'
import { PAGE_TEXT } from '@/components/site/page-text'
import { pageMetadata } from '@/components/site/seo'

export const revalidate = 60

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { ui, settings } = await getShared(locale)
  return pageMetadata(locale, '/about', {
    title: ui.nav?.about || PAGE_TEXT[locale].about,
    description: settings.accreditation || undefined,
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [shared, home] = await Promise.all([getShared(locale), getHomeData(locale)])
  return <AboutPage shared={shared} home={home} locale={locale} />
}
