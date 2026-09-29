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
import { APIError, buildConfig, type EmailAdapter } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { arTranslationFixes } from './admin/translations'
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
 * Database: DATABASE_URL (Supabase "Session pooler" connection string; POSTGRES_URL also accepted).
 * Secret: PAYLOAD_SECRET (`npm run secrets` fills it). If not set (e.g. trying the site locally)
 * it is derived from the database address — which changes if the DB password changes.
 */
const databaseURL = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
/**
 * No database address (or `file:...`) = trying the site on your own computer:
 * everything is kept in one local file (almrkz-local.db). Never used on the real hosting.
 */
const localFile = !databaseURL || databaseURL.startsWith('file:')
if (localFile && process.env.VERCEL) {
  throw new Error('DATABASE_URL is missing: add the Supabase connection string to Vercel.')
}
const secret =
  process.env.PAYLOAD_SECRET ||
  crypto.createHash('sha256').update(`almrkz:${databaseURL || 'local'}`).digest('hex')

/** الأقسام اللي بتنعرض ببطاقات الموقع نفسها بدل الجدول */
const CARD_VIEWS = ['success-stories', 'staff', 'partners', 'courses', 'news', 'course-groups']

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
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpOnThisComputer = /^(localhost|127.0.0.1)$/.test(process.env.SMTP_HOST || '')
const smtpEmail = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@almrkz.net',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'كلية المركز — الموقع',
      // Don't open an SMTP connection on every server start (each Vercel cold start would wait
      // for Gmail). `npm run check:env` tests the login once, before the build.
      skipVerify: true,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: smtpPort,
        // 465 = TLS from the first byte. 587 (Gmail, Resend) = STARTTLS, and it is required, so
        // the password is never sent unencrypted. A catcher on this computer (tests) has no TLS.
        secure: smtpPort === 465,
        requireTLS: smtpPort !== 465 && !smtpOnThisComputer,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      },
    })
  : undefined

/**
 * A failed send (wrong SMTP password, provider down) reached «نسيت كلمة السر» as Payload's
 * English «Something went wrong». Same adapter, but the failure is logged and shown in Arabic.
 * (New-lead emails catch their own errors — the lead is always saved.)
 */
const email = smtpEmail?.then(
  (adapter): EmailAdapter =>
    (args) => {
      const initialized = adapter(args)
      return {
        ...initialized,
        sendEmail: async (message) => {
          try {
            return await initialized.sendEmail(message)
          } catch (err) {
            args.payload.logger.error({ err, msg: 'Sending email failed' })
            throw new APIError(
              'ما قدرنا نبعت الإيميل هلأ. جرّب كمان شوي، وإذا ضلّت المشكلة احكي مع المسؤول عن الموقع.',
              502,
              undefined,
              true,
            )
          }
        },
      }
    },
)

export default buildConfig({
  serverURL: serverURL(),
  admin: {
    user: Users.slug,
    // No Gravatar (external service; the image is blocked on some networks).
    avatar: 'default',
    // نفس ألوان الموقع (أبيض وأخضر) — الأنماط في src/app/(payload)/custom.scss
    theme: 'light',
    components: {
      graphics: { Logo: '@/admin/Logo#Logo', Icon: '@/admin/Logo#Icon' },
      Nav: '@/admin/nav/Nav#Nav',
      views: {
        dashboard: { Component: '@/admin/dashboard/Dashboard#Dashboard' },
        // «نسيت كلمة السر» بتحكي الحقيقة لما الإيميل مش مركّب أو الإرسال فشل
        forgot: { Component: '@/admin/forgot/ForgotPassword#ForgotPassword' },
        // التوقيع الإلكتروني — نفس اللوحة ونفس الدخول (src/admin/signing, src/features/signing)
        signingDocuments: { Component: '@/admin/signing/views#SigningDocumentsView', path: '/documents', exact: true },
        signingDocument: { Component: '@/admin/signing/views#SigningDocumentView', path: '/documents/:id', exact: true },
        signingSigned: { Component: '@/admin/signing/views#SigningSignedView', path: '/signed', exact: true },
        signingSettings: { Component: '@/admin/signing/views#SigningSettingsView', path: '/settings', exact: true },
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — لوحة تحكم كلية المركز',
      description: 'لوحة تحكم موقع كلية المركز للتأهيل المهني',
      // College mark in the browser tab (instead of Payload's black «P»)
      icons: [{ rel: 'icon', type: 'image/png', url: '/admin-icon.png' }],
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
    // أخطاء بالترجمة العربية الجاهزة تبعت Payload (src/admin/translations.ts)
    translations: { ar: arTranslationFixes },
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
  ]
    .map((c) =>
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
    )
    // بدل الجدول: نفس بطاقات الموقع مع تعديل مباشر عليها (src/admin/cards)
    .map((c) =>
      CARD_VIEWS.includes(c.slug)
        ? {
            ...c,
            admin: {
              ...c.admin,
              components: {
                ...c.admin?.components,
                views: { ...c.admin?.components?.views, list: { Component: '@/admin/cards/CardsListView#CardsListView' } },
              },
            },
          }
        : c,
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
        // Each Vercel instance keeps its own small pool. Supabase's pooler has a fixed number of
        // connections for the whole project (shared with the e-signature part), so stay small.
        pool: { connectionString: databaseURL, max: 5, idleTimeoutMillis: 10_000 },
        migrationDir: path.resolve(dirname, 'migrations'),
        // Schema changes are applied ONLY by migrations (`npm run migrate`, and `npm run ci` on
        // Vercel). Never "push": this database also holds the e-signature tables (Supabase), and a
        // push compares the whole database with Payload's tables — it crashes on them, or would
        // offer to drop them. It would also leave a "dev" mark that stops later `payload migrate`
        // runs with a question nobody can answer on Vercel. PAYLOAD_DB_PUSH=true only on a
        // throw-away Postgres that has no e-signature tables.
        push: process.env.PAYLOAD_DB_PUSH === 'true',
      }),
  email,
  sharp,
  upload: {
    limits: { fileSize: 50 * 1024 * 1024 },
  },
  /*
   * Background jobs = «نشر مجدول» (schedule publish) on news. Vercel has no always-on server, so
   * a Vercel Cron (vercel.json → /api/payload-jobs/run) runs the due jobs. Vercel sends
   * "Authorization: Bearer <CRON_SECRET>" (the CRON_SECRET environment variable); a logged-in
   * admin may also run them.
   */
  jobs: {
    access: {
      run: ({ req }) => {
        if (req.user) return true
        const cronSecret = process.env.CRON_SECRET
        return Boolean(cronSecret) && req.headers.get('authorization') === `Bearer ${cronSecret}`
      },
    },
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
