import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

/**
 * /robots.txt — the public site is open to search engines; admin, API and signing links are not.
 * Uploaded images/videos are served under /api/media/file/, and Google must be able to fetch them
 * (logo and course images in the structured data, share previews, Google Images) — the longer
 * «allow» rule wins over «disallow: /api».
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/media/file/'],
      disallow: ['/admin', '/api', '/sign', '/next'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
