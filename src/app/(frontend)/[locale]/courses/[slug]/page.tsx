import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getShared, isLocale, mediaUrl, visibleGroupSlugs } from '@/components/site/data'
import { GroupPage } from '@/components/site/pages'
import { pageMetadata } from '@/components/site/seo'
import { encodeSlug } from '@/lib/seo'

export const revalidate = 60

/** The groups the website shows are built ahead of time; others on their first visit. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return isLocale(params.locale) ? visibleGroupSlugs(params.locale) : []
}

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const g = (await getShared(locale)).groups.find((x) => x.slug === decodeURIComponent(slug))
  if (!g) return {}
  return pageMetadata(locale, `/courses/${encodeSlug(g.slug)}`, {
    title: g.seo?.title || g.name,
    description: g.seo?.description || g.tagline || g.description,
    image: mediaUrl(g.seo?.image, 'wide') || mediaUrl(g.image, 'wide'),
  })
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const shared = await getShared(locale)
  const g = shared.groups.find((x) => x.slug === decodeURIComponent(slug))
  if (!g) notFound()
  return <GroupPage g={g} shared={shared} locale={locale} />
}
