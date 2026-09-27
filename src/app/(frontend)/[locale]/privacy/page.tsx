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
  return pageMetadata(locale, '/privacy', {
    title: legalTitle(locale, 'privacy'),
    description: legalDescription(locale, 'privacy'),
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <LegalPage slug="privacy" shared={await getShared(locale)} locale={locale} />
}
