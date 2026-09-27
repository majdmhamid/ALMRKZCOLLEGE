import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/components/site/data'
import { LEGAL_SLUGS, LEGAL_UPDATED } from '@/components/site/legal-links'
import { LOCALES } from '@/lib/preview'
import { encodeSlug, languageUrls } from '@/lib/seo'

/**
 * /sitemap.xml — every public page in Arabic and Hebrew, for Google. Only PUBLISHED content
 * (drafts never appear). Rebuilt at most once an hour.
 */
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

const latest = (...dates: (string | null | undefined)[]) =>
  dates.filter(Boolean).sort().at(-1) ?? undefined

/** One entry per language for the page at `/{locale}{rest}`, each listing both languages. */
function page(rest: string, lastModified?: string, priority?: number): Entry[] {
  const languages = languageUrls(rest)
  return LOCALES.map((l) => ({
    url: languages[l],
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const published = { _status: { equals: 'published' } } as const
  const opts = { draft: false, overrideAccess: false, depth: 0, pagination: false } as const
  const [homepage, groups, courses, news] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', draft: false, depth: 0 }),
    payload.find({ collection: 'course-groups', where: published, ...opts, sort: 'order' }),
    payload.find({ collection: 'courses', where: published, ...opts, sort: 'order' }),
    payload.find({ collection: 'news', where: published, ...opts, sort: '-publishedAt' }),
  ])

  const coursesWithSlug = courses.docs.filter((c) => c.slug)
  const groupIds = new Set(
    coursesWithSlug.map((c) => (typeof c.group === 'object' ? c.group?.id : c.group)),
  )
  const lastCourse = latest(...coursesWithSlug.map((c) => c.updatedAt))

  return [
    ...page('', latest(homepage.updatedAt, lastCourse), 1),
    ...page('/courses', lastCourse, 0.9),
    ...groups.docs
      .filter((g) => g.slug && groupIds.has(g.id))
      .flatMap((g) => page(`/courses/${encodeSlug(g.slug)}`, g.updatedAt, 0.8)),
    ...coursesWithSlug.flatMap((c) => page(`/course/${encodeSlug(c.slug)}`, c.updatedAt, 0.8)),
    ...news.docs
      .filter((n) => n.slug)
      .flatMap((n) => page(`/news/${encodeSlug(n.slug)}`, n.updatedAt, 0.6)),
    ...LEGAL_SLUGS.flatMap((s) => page(`/${s}`, LEGAL_UPDATED[s], 0.3)),
  ]
}
