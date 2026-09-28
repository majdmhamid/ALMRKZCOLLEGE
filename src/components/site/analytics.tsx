import React from 'react'

import { ANALYTICS_ENABLED, GOOGLE_SITE_VERIFICATION } from '@/lib/analytics'

import { ConsentManager } from './consent'

/**
 * Statistics / ads measurement + the cookie banner, and the Search Console verification tag.
 * Everything here is decided at build time from the NEXT_PUBLIC_* IDs (src/lib/analytics.ts),
 * so pages stay static. Without IDs this renders nothing at all.
 */
export function Analytics({ locale }: { locale: string }) {
  return (
    <>
      {/* React hoists this <meta> into <head>. */}
      {GOOGLE_SITE_VERIFICATION && (
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      )}
      {ANALYTICS_ENABLED && <ConsentManager locale={locale} />}
    </>
  )
}
