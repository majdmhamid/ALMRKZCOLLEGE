import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getShared, isLocale } from '@/components/site/data'
import { LegalPage, legalDescription, legalTitle } from '@/components/site/legal'
import { pageMetadata } from '@/components/site/seo'

export const revalidate = 60

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return pageMetadata(locale, '/accessibility', {
    title: legalTitle(locale, 'accessibility'),
    description: legalDescription(locale, 'accessibility'),
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <LegalPage slug="accessibility" shared={await getShared(locale)} locale={locale} />
}
