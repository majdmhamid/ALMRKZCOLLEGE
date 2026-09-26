import { notFound } from 'next/navigation'

import { getHomeData, getShared, isLocale } from '@/components/site/data'
import { HomeSections } from '@/components/site/sections'

export const revalidate = 60

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [shared, home] = await Promise.all([getShared(locale), getHomeData(locale)])
  return <HomeSections shared={shared} home={home} locale={locale} />
}
