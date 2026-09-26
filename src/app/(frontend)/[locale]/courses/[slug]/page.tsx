import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getShared, isLocale } from '@/components/site/data'
import { GroupPage } from '@/components/site/pages'

export const revalidate = 60

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const g = (await getShared(locale)).groups.find((x) => x.slug === decodeURIComponent(slug))
  return g ? { title: g.seo?.title || g.name, description: g.seo?.description || g.tagline } : {}
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const shared = await getShared(locale)
  const g = shared.groups.find((x) => x.slug === decodeURIComponent(slug))
  if (!g) notFound()
  return <GroupPage g={g} shared={shared} locale={locale} />
}
