import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getShared, isLocale } from '@/components/site/data'
import { ContactPage } from '@/components/site/extra-pages'
import { PAGE_TEXT } from '@/components/site/page-text'
import { pageMetadata } from '@/components/site/seo'

export const revalidate = 60

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { ui, settings } = await getShared(locale)
  return pageMetadata(locale, '/contact', {
    title: ui.nav?.contact || PAGE_TEXT[locale].contact,
    description: settings.contact?.address || undefined,
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <ContactPage shared={await getShared(locale)} locale={locale} />
}
