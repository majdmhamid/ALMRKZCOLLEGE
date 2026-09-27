import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import type {
  Course,
  CourseGroup,
  Media,
  News,
  Partner,
  Staff,
  SuccessStory,
} from '@/payload-types'
import { LOCALES } from '@/lib/preview'
import type { SiteLocale } from '@/lib/rules'

export const isLocale = (v: string): v is SiteLocale => (LOCALES as string[]).includes(v)

export const getPayloadClient = cache(async () => getPayload({ config }))

export const isDraft = cache(async () => (await draftMode()).isEnabled)

/** Tag of all cached website data — cleared by hooks/revalidate.ts whenever an editor saves. */
export const SITE_CACHE_TAG = 'site'

/**
 * Published content is cached (no database trip per visitor); drafts (preview) never are.
 */
async function cached<T>(key: string[], draft: boolean, fn: () => Promise<T>): Promise<T> {
  if (draft) return fn()
  return unstable_cache(fn, key, { tags: [SITE_CACHE_TAG], revalidate: 3600 })()
}

/** Everything shared by all pages: settings, menu, fixed texts, groups, courses. */
export const getShared = cache(async (locale: SiteLocale) => {
  const draft = await isDraft()
  return cached(['shared', locale], draft, () => loadShared(locale, draft))
})

async function loadShared(locale: SiteLocale, draft: boolean) {
  const payload = await getPayloadClient()
  const opts = { locale, draft, overrideAccess: draft, depth: 2 } as const
  const [settings, navigation, ui, groups, courses] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', ...opts }),
    payload.findGlobal({ slug: 'navigation', ...opts }),
    payload.findGlobal({ slug: 'ui-texts', ...opts }),
    payload.find({ collection: 'course-groups', ...opts, depth: 1, sort: 'order', limit: 100 }),
    payload.find({ collection: 'courses', ...opts, depth: 1, sort: 'order', limit: 200 }),
  ])
  const publishedCourses = courses.docs.filter((c) => draft || c._status === 'published')
  return {
    settings,
    navigation,
    ui,
    groups: groups.docs.filter((g) => draft || g._status === 'published'),
    courses: publishedCourses,
  }
}

export type Shared = Awaited<ReturnType<typeof loadShared>>

export const getHomeData = cache(async (locale: SiteLocale) => {
  const draft = await isDraft()
  return cached(['home', locale], draft, () => loadHome(locale, draft))
})

async function loadHome(locale: SiteLocale, draft: boolean) {
  const payload = await getPayloadClient()
  const opts = { locale, draft, overrideAccess: draft } as const
  const [homepage, stories, staff, partners, news, gallery] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', ...opts, depth: 2 }),
    payload.find({ collection: 'success-stories', ...opts, depth: 2, sort: 'order', limit: 50 }),
    payload.find({ collection: 'staff', ...opts, depth: 1, sort: 'order', limit: 50 }),
    payload.find({ collection: 'partners', ...opts, depth: 1, sort: 'order', limit: 50 }),
    payload.find({
      collection: 'news',
      ...opts,
      depth: 1,
      sort: ['-pinned', '-publishedAt'],
      limit: 12,
    }),
    payload.findGlobal({ slug: 'gallery', ...opts, depth: 1 }),
  ])
  return {
    homepage,
    stories: stories.docs as SuccessStory[],
    staff: staff.docs as Staff[],
    partners: partners.docs as Partner[],
    news: news.docs as News[],
    gallery,
  }
}

/** One document by slug (course / news page). */
export async function getBySlug<C extends 'courses' | 'news'>(
  collection: C,
  locale: SiteLocale,
  slug: string,
) {
  const draft = await isDraft()
  const clean = decodeURIComponent(slug)
  return cached([collection, locale, clean], draft, async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection,
      where: { slug: { equals: clean } },
      locale,
      draft,
      overrideAccess: draft,
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  })
}

/* ───────── small helpers used by the components ───────── */

export const asDoc = <T extends { id: number }>(v: number | T | null | undefined): T | undefined =>
  v && typeof v === 'object' ? v : undefined

export function mediaUrl(
  m: number | Media | null | undefined,
  size?: 'thumbnail' | 'card' | 'wide' | 'hero',
): string | undefined {
  const doc = asDoc(m)
  if (!doc) return undefined
  return (size && doc.sizes?.[size]?.url) || doc.url || undefined
}

export const mediaAlt = (m: number | Media | null | undefined) => asDoc(m)?.alt ?? ''

/** Intrinsic width/height of an uploaded image (reserves the space before it loads → no jumping). */
export function mediaDims(m: number | Media | null | undefined): {
  width?: number
  height?: number
} {
  const doc = asDoc(m)
  return doc?.width && doc?.height ? { width: doc.width, height: doc.height } : {}
}

export function whatsappHref(shared: Shared, message?: string | null) {
  const n = shared.settings.contact?.whatsapp || ''
  const text = message ?? shared.settings.contact?.whatsappMessage ?? ''
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const telHref = (n?: string | null) => (n ? `tel:${n.replace(/[^\d+]/g, '')}` : '#')

type LinkData = {
  type?: string | null
  anchor?: string | null
  page?: string | null
  course?: number | Course | null
  courseGroup?: number | CourseGroup | null
  url?: string | null
  whatsappMessage?: string | null
}

const PAGE_TARGETS: Record<string, (l: string) => string> = {
  home: (l) => `/${l}`,
  courses: (l) => `/${l}/courses`,
  about: (l) => `/${l}#why`,
  gallery: (l) => `/${l}#video`,
  'success-stories': (l) => `/${l}#graduates`,
  news: (l) => `/${l}#news`,
  companies: (l) => `/${l}#employers`,
  contact: (l) => `/${l}#contact`,
  register: (l) => `/${l}#register`,
  staff: (l) => `/${l}#staff`,
  faq: (l) => `/${l}#faq`,
  accessibility: (l) => `/${l}#contact`,
}

export function linkHref(
  link: LinkData | null | undefined,
  locale: string,
  shared: Shared,
): string {
  if (!link) return '#'
  switch (link.type) {
    case 'anchor':
      return `/${locale}#${link.anchor ?? ''}`
    case 'page':
      return (PAGE_TARGETS[link.page ?? 'home'] ?? PAGE_TARGETS.home)(locale)
    case 'course':
      return `/${locale}/course/${asDoc(link.course)?.slug ?? ''}`
    case 'courseGroup':
      return `/${locale}/courses/${asDoc(link.courseGroup)?.slug ?? ''}`
    case 'whatsapp':
      return whatsappHref(shared, link.whatsappMessage)
    case 'phone':
      return telHref(shared.settings.contact?.phones?.[0]?.number)
    case 'external':
      return link.url || '#'
    default:
      return '#'
  }
}

export const isExternal = (href: string) => /^https?:\/\//.test(href)

export const courseHref = (locale: string, c: Pick<Course, 'slug'>) => `/${locale}/course/${c.slug}`
export const groupHref = (locale: string, g: Pick<CourseGroup, 'slug'>) =>
  `/${locale}/courses/${g.slug}`

export const formatDate = (iso: string, locale: SiteLocale) =>
  new Date(iso).toLocaleDateString(locale === 'he' ? 'he-IL' : 'ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
