import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

/** /robots.txt — the public site is open to search engines; admin, API and signing links are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/sign', '/next'] },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
