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
  Navigation,
  News,
  Partner,
  Staff,
  SuccessStory,
} from '@/payload-types'
import { groupState, groupsWithPublishedCourses } from '@/lib/group-visibility'
import { LOCALES, STORIES_ANCHOR } from '@/lib/preview'
import type { SiteLocale } from '@/lib/rules'

export const isLocale = (v: string): v is SiteLocale => (LOCALES as string[]).includes(v)

export const getPayloadClient = cache(async () => getPayload({ config }))

export const isDraft = cache(async () => (await draftMode()).isEnabled)

/** Tag of all cached website data — cleared by hooks/revalidate.ts whenever an editor saves. */
export const SITE_CACHE_TAG = 'site'

/**
 * Vercel keeps this cache across deploys, but a deploy can change the data itself (the seed
 * runs outside Next.js, so it can't clear the tag) — each deploy gets its own cache entries.
 */
const DEPLOY = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || 'local'

/**
 * Published content is cached (no database trip per visitor); drafts (preview) never are.
 */
async function cached<T>(key: string[], draft: boolean, fn: () => Promise<T>): Promise<T> {
  if (draft) return fn()
  return unstable_cache(fn, [DEPLOY, ...key], { tags: [SITE_CACHE_TAG], revalidate: 3600 })()
}

/** Everything shared by all pages: settings, menu, fixed texts, groups, courses. */
export const getShared = cache(async (locale: SiteLocale) => {
  const draft = await isDraft()
  // «v2»: groups without courses are now hidden — don't reuse data cached by older builds.
  return cached(['shared', 'v2', locale], draft, () => loadShared(locale, draft))
})

/** Id of a relationship value (populated document or bare id). */
const relId = (v: number | { id: number } | null | undefined) =>
  v && typeof v === 'object' ? v.id : (v ?? undefined)

type MenuItem = {
  link?: { type?: string | null; courseGroup?: number | CourseGroup | null } | null
}

/** Removes menu / footer links that point to a course group the website doesn't show. */
function withoutHiddenGroupLinks(nav: Navigation, visible: Set<number>): Navigation {
  const keep = (item: MenuItem) => {
    if (item.link?.type !== 'courseGroup') return true
    const id = relId(item.link.courseGroup)
    return id !== undefined && visible.has(id)
  }
  const { header, footer } = nav
  return {
    ...nav,
    header: header && {
      ...header,
      items: header.items?.filter(keep).map((i) => ({ ...i, children: i.children?.filter(keep) })),
    },
    footer: footer && {
      ...footer,
      columns: footer.columns?.map((col) => ({ ...col, links: col.links?.filter(keep) })),
      bottomLinks: footer.bottomLinks?.filter(keep),
    },
  }
}

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
  // A course group is shown on the website only when it is published AND has at least one
  // published course (lib/group-visibility.ts — the admin panel shows the same rule). In preview
  // (draft mode) staff see every group.
  const groupsWithCourses = groupsWithPublishedCourses(publishedCourses)
  const visibleGroups = groups.docs.filter(
    (g) => draft || groupState(g._status, groupsWithCourses.has(g.id)) === 'visible',
  )
  return {
    settings,
    navigation: withoutHiddenGroupLinks(navigation, new Set(visibleGroups.map((g) => g.id))),
    ui,
    groups: visibleGroups,
    courses: publishedCourses,
  }
}

export type Shared = Awaited<ReturnType<typeof loadShared>>

export const getHomeData = cache(async (locale: SiteLocale) => {
  const draft = await isDraft()
  const [home, shared] = await Promise.all([
    cached(['home', locale], draft, () => loadHome(locale, draft)),
    getShared(locale),
  ])
  // Groups picked by hand in the «مجالات الدورات» section: drop the ones the site hides.
  const visible = new Set(shared.groups.map((g) => g.id))
  const sections = home.homepage.sections?.map((s) =>
    s.blockType === 'courseGroups' && s.groups
      ? { ...s, groups: s.groups.filter((g) => visible.has(relId(g)!)) }
      : s,
  )
  return { ...home, homepage: { ...home.homepage, sections } }
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

/** All published news items, pinned first then newest (the /news page). */
export const getAllNews = cache(async (locale: SiteLocale) => {
  const draft = await isDraft()
  return cached(['news-list', locale], draft, async () => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'news',
      locale,
      draft,
      overrideAccess: draft,
      depth: 1,
      sort: ['-pinned', '-publishedAt'],
      limit: 200,
    })
    return docs as News[]
  })
})

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

/* ───────── pages built ahead of time (static + ISR) ───────── */

/*
 * Speed: every public page is built once and then served from the cache/CDN (see `revalidate` in
 * the pages). Visitors never wait for the server or the database. When an editor saves in /admin,
 * hooks/revalidate.ts clears the cache and the next visit gets the new version.
 * Staff in preview (draft mode) skip the cache automatically — Next.js renders their request
 * fresh, with drafts — so `draftMode()` is only read inside the data loaders above.
 *
 * The lists below only say which addresses to build during `next build`; any page added later is
 * built on its first visit. If the database can't be reached they return nothing (pages are then
 * built on demand), so a hiccup never breaks the deployment.
 */

/** { locale } for every language — used by the [locale] layout. */
export const localeParams = () => LOCALES.map((locale) => ({ locale }))

/** Slugs of the published courses / news items (built at deploy time). */
export async function publishedSlugs(collection: 'courses' | 'news'): Promise<{ slug: string }[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection,
      where: { _status: { equals: 'published' } },
      draft: false,
      overrideAccess: false,
      depth: 0,
      pagination: false,
      select: { slug: true },
    })
    return docs.flatMap((d) => (d.slug ? [{ slug: d.slug }] : []))
  } catch {
    return []
  }
}

/** Slugs of the course groups the website shows in this language. */
export async function visibleGroupSlugs(locale: SiteLocale): Promise<{ slug: string }[]> {
  try {
    const { groups } = await loadShared(locale, false)
    return groups.flatMap((g) => (g.slug ? [{ slug: g.slug }] : []))
  } catch {
    return []
  }
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
  about: (l) => `/${l}/about`,
  gallery: (l) => `/${l}#video`,
  'success-stories': (l) => `/${l}#${STORIES_ANCHOR}`,
  news: (l) => `/${l}/news`,
  companies: (l) => `/${l}#employers`,
  contact: (l) => `/${l}/contact`,
  register: (l) => `/${l}#register`,
  staff: (l) => `/${l}#staff`,
  faq: (l) => `/${l}#faq`,
  // The legal page (legal.tsx) — also fixes links already stored in the database.
  accessibility: (l) => `/${l}/accessibility`,
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
