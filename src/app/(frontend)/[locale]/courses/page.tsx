import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getShared, isLocale } from '@/components/site/data'
import { AllCoursesPage } from '@/components/site/pages'

export const revalidate = 60

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { ui } = await getShared(locale)
  return { title: ui.nav?.allCourses ?? undefined }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <AllCoursesPage shared={await getShared(locale)} locale={locale} />
}
