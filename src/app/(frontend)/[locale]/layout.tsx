import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { Footer, Header, MobileBar } from '@/components/site/chrome'
import { RevealObserver } from '@/components/site/client'
import { getShared, isDraft, isLocale, localeParams, mediaUrl } from '@/components/site/data'
import { serverURL } from '@/lib/preview'
import type { SiteLocale } from '@/lib/rules'
import { RefreshRouteOnSave } from '../refresh-on-save'
import '@/components/site/site.css'
import '../fonts.css'
import '../perf.css'

export const revalidate = 60

/** Both languages are built ahead of time and served from the cache (see data.ts). */
export const generateStaticParams = localeParams

/** Fonts the first screen needs in each language (all fonts are self-hosted in /public/fonts). */
const PRELOAD_FONTS: Record<SiteLocale, string[]> = {
  ar: ['Almarai-400-arabic.woff2', 'Almarai-800-arabic.woff2'],
  he: ['Heebo-var-hebrew.woff2', 'Almarai-400-latin.woff2'],
}

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
        {/* Speed: fetch the main fonts right away (with the CSS) instead of after the first layout. */}
        {PRELOAD_FONTS[locale].map((f) => (
          <link
            key={f}
            rel="preload"
            href={`/fonts/${f}`}
            as="font"
            type="font/woff2"
            crossOrigin=""
          />
        ))}
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
