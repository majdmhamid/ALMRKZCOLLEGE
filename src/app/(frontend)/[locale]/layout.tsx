import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { Footer, Header, MobileBar } from '@/components/site/chrome'
import { RefreshRouteOnSave, RevealObserver } from '@/components/site/client'
import { getShared, isDraft, isLocale, mediaUrl } from '@/components/site/data'
import { serverURL } from '@/lib/preview'
import '@/components/site/site.css'

export const revalidate = 60

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { settings } = await getShared(locale)
  const seo = settings.seo
  const title = seo?.defaultTitle || settings.siteName || ''
  const icon =
    mediaUrl(settings.favicon) || mediaUrl(settings.logoMark) || mediaUrl(settings.logoLight)
  const og = mediaUrl(seo?.ogImage, 'wide')
  return {
    metadataBase: new URL(serverURL()),
    title: { default: title, template: seo?.titleTemplate || `%s | ${settings.siteName ?? ''}` },
    description: seo?.defaultDescription ?? undefined,
    icons: icon ? { icon } : undefined,
    openGraph: {
      title,
      description: seo?.defaultDescription ?? undefined,
      images: og ? [og] : undefined,
      locale: locale === 'he' ? 'he_IL' : 'ar',
    },
    alternates: { languages: { ar: '/ar', he: '/he' } },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const shared = await getShared(locale)
  const draft = await isDraft()
  return (
    <html lang={locale} dir="rtl" className="no-js">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap"
        />
      </head>
      <body>
        <div className="page">
          <Header shared={shared} locale={locale} />
          <main id="top" style={{ flex: 1, marginTop: -80 }}>
            {children}
          </main>
          <Footer shared={shared} locale={locale} />
          <MobileBar shared={shared} locale={locale} />
        </div>
        <RevealObserver />
        {draft && <RefreshRouteOnSave serverURL={serverURL()} />}
      </body>
    </html>
  )
}
