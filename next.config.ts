import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Keep our own CLAUDE.md untouched (next dev would append its own block).
  agentRules: false,
  async redirects() {
    return [{ source: '/', destination: '/ar', permanent: false }]
  },
  async headers() {
    return [
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

const config = withPayload(nextConfig, { devBundleServerPackages: false })

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
