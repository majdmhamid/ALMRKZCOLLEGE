import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/** نصوص التوقيع الإلكتروني (عربي/عبري) — next-intl بدون توجيه باللغة */
const withNextIntl = createNextIntlPlugin('./src/features/signing/i18n/request.ts')

const nextConfig: NextConfig = {
  // Keep our own CLAUDE.md untouched (next dev would append its own block).
  agentRules: false,
  // PGlite: قاعدة بيانات التوقيع بوضع التجربة على الجهاز
  serverExternalPackages: ['@electric-sql/pglite'],
  // …and only there (never on Vercel: no MOCK_BACKEND, and Supabase is set). Keep its ~20 MB out of
  // every server function that Vercel packages. Local `next dev` / `next start` don't use traces.
  outputFileTracingExcludes: { '*': ['node_modules/@electric-sql/pglite/**'] },
  experimental: {
    serverActions: {
      // صور التواقيع (PNG صغيرة). ملفات PDF بتنرفع مباشرة من المتصفح للتخزين.
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [{ source: '/', destination: '/ar', permanent: false }]
  },
  async headers() {
    return [
      // Basic browser protections on every address (site, admin, signing). Framing is allowed
      // only from the site itself (the admin panel's live preview shows the site in a frame).
      // Camera/microphone/location are never used, so no page (or embedded map/video) may ask.
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Fonts never change under the same name → the browser keeps them for a year.
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Uploaded images/videos served by Payload (local or self-hosted mode; on Vercel Blob the
      // CDN sets its own headers). A replaced file gets a new name, so a day of caching is safe.
      {
        source: '/api/media/file/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=2592000' },
        ],
      },
    ]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

const config = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })

/*
 * Speed: Payload adds `Critical-CH: Sec-CH-Prefers-Color-Scheme` to every page so the admin panel
 * can pick dark/light mode on the server. That header makes Chrome restart the very first request
 * (one extra round trip, ~0.2–0.7 s on mobile). Only /admin needs it, so keep it there only.
 */
const payloadHeaders = config.headers
config.headers = async () => {
  const rules = (await payloadHeaders?.()) ?? []
  return rules.flatMap((rule) => {
    const isPayloadRule =
      rule.source === '/:path*' && rule.headers.some((h) => h.key === 'Critical-CH')
    if (!isPayloadRule) return [rule]
    return [
      { ...rule, source: '/admin' },
      { ...rule, source: '/admin/:path*' },
    ]
  })
}

export default config
