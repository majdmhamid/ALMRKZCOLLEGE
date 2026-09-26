import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { ar } from '@payloadcms/translations/languages/ar'
import { he } from '@payloadcms/translations/languages/he'
import crypto from 'crypto'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { CourseGroups } from './collections/CourseGroups'
import { Courses } from './collections/Courses'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Partners } from './collections/Partners'
import { Staff } from './collections/Staff'
import { SuccessStories } from './collections/SuccessStories'
import { Users } from './collections/Users'
import { Gallery } from './globals/Gallery'
import { Homepage } from './globals/Homepage'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'
import { UiTexts } from './globals/UiTexts'
import { revalidateAfterChange, revalidateAfterDelete, revalidateGlobal } from './hooks/revalidate'
import { previewPath, serverURL } from './lib/preview'

/*
 * Database: DATABASE_URL (Neon on Vercel sets it automatically; POSTGRES_URL also accepted).
 * Secret: PAYLOAD_SECRET, or — if not set — derived from the (already secret) database address,
 * so a first deploy needs no manual setting.
 */
const databaseURL = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
/**
 * No database address (or `file:...`) = trying the site on your own computer:
 * everything is kept in one local file (almrkz-local.db). Never used on the real hosting.
 */
const localFile = !databaseURL || databaseURL.startsWith('file:')
if (localFile && process.env.VERCEL) {
  throw new Error('DATABASE_URL is missing: connect a Postgres database (Neon) to the Vercel project.')
}
const secret =
  process.env.PAYLOAD_SECRET ||
  crypto.createHash('sha256').update(`almrkz:${databaseURL || 'local'}`).digest('hex')

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/*
 * Media storage. Vercel does not keep uploaded files on its disk, so production
 * must use cloud storage: Vercel Blob (BLOB_READ_WRITE_TOKEN) or any
 * S3-compatible bucket (S3_BUCKET + keys). With neither, files go to ./media
 * (local development only).
 */
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
const useS3 = !useBlob && Boolean(process.env.S3_BUCKET)

/*
 * Email (new-lead notifications, password reset). Any SMTP provider works:
 * Gmail/Google Workspace, Resend (smtp.resend.com), Brevo, etc.
 * Without SMTP_HOST, emails are only printed to the server log.
 */
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@almrkz.net',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'كلية المركز — الموقع',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
    })
  : undefined

export default buildConfig({
  serverURL: serverURL(),
  admin: {
    user: Users.slug,
    // No Gravatar (external service; the image is blocked on some networks).
    avatar: 'default',
    components: {
      graphics: { Logo: '@/admin/Logo#Logo' },
    },
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — لوحة تحكم كلية المركز',
      description: 'لوحة تحكم موقع كلية المركز للتأهيل المهني',
    },
    dateFormat: 'dd/MM/yyyy HH:mm',
    livePreview: {
      url: ({ data, collectionConfig, globalConfig, locale }) => {
        if (globalConfig) return previewPath({ global: globalConfig.slug, locale: locale?.code })
        return previewPath({
          collection: collectionConfig?.slug as 'courses',
          slug: data?.slug as string,
          locale: locale?.code,
        })
      },
      collections: ['courses', 'course-groups', 'news', 'success-stories'],
      globals: ['homepage'],
      breakpoints: [
        { label: 'موبايل', name: 'mobile', width: 390, height: 844 },
        { label: 'تابلت', name: 'tablet', width: 820, height: 1180 },
        { label: 'كمبيوتر', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },

  // Admin panel language: Arabic (right-to-left). Hebrew available in the user menu.
  i18n: {
    supportedLanguages: { ar, he },
    fallbackLanguage: 'ar',
  },

  // Website content: every text field marked `localized` has an Arabic and a Hebrew version.
  localization: {
    locales: [
      { code: 'ar', label: 'عربي', rtl: true },
      { code: 'he', label: 'עברית', rtl: true },
    ],
    defaultLocale: 'ar',
    fallback: true,
  },

  collections: [
    Courses,
    CourseGroups,
    News,
    SuccessStories,
    Staff,
    Partners,
    Media,
    Leads,
    Users,
  ].map((c) =>
    ['leads', 'users'].includes(c.slug)
      ? c
      : {
          ...c,
          hooks: {
            ...c.hooks,
            afterChange: [...(c.hooks?.afterChange ?? []), revalidateAfterChange],
            afterDelete: [...(c.hooks?.afterDelete ?? []), revalidateAfterDelete],
          },
        },
  ),
  globals: [Homepage, UiTexts, Gallery, SiteSettings, Navigation].map((g) => ({
    ...g,
    hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), revalidateGlobal] },
  })),

  editor: lexicalEditor(),
  secret,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: localFile
    ? sqliteAdapter({
        client: { url: databaseURL || 'file:./almrkz-local.db' },
        push: true,
      })
    : postgresAdapter({
        pool: { connectionString: databaseURL },
        migrationDir: path.resolve(dirname, 'migrations'),
        // Schema changes are applied by migrations in production (`npm run ci`).
        push: process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_DB_PUSH !== 'false',
      }),
  email,
  sharp,
  upload: {
    limits: { fileSize: 50 * 1024 * 1024 },
  },
  plugins: [
    vercelBlobStorage({
      enabled: useBlob,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      // Upload straight from the browser, so big videos don't hit Vercel's 4.5 MB request limit.
      clientUploads: true,
    }),
    s3Storage({
      enabled: useS3,
      bucket: process.env.S3_BUCKET || '',
      collections: { media: true },
      clientUploads: true,
      config: {
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT),
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
