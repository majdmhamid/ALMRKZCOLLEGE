import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { dirOf, type Locale } from '@/features/signing/i18n/config'
import '@/features/signing/styles/public.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app')
  return {
    title: { default: t('name'), template: `%s · ${t('name')}` },
    description: t('tagline'),
    // روابط التوقيع خاصة — ممنوع تنفهرس
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#158942' }

/** صفحة التوقيع للعميل (/sign/[token]) — بدون ترويسة الموقع، بلغة جواله (عربي/عبري) */
export default async function SignLayout({ children }: { children: ReactNode }) {
  const locale = (await getLocale()) as Locale
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
