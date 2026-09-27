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
  experimental: {
    serverActions: {
      // صور التواقيع (PNG صغيرة). ملفات PDF بتنرفع مباشرة من المتصفح للتخزين.
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [{ source: '/', destination: '/ar', permanent: false }]
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

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
