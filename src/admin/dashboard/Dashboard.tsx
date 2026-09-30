import type { CollectionSlug, ServerProps } from 'payload'
import Link from 'next/link'
import React from 'react'

import { hasRole } from '@/access'
import type { Lead, Media } from '@/payload-types'

import { adminLang, shellText } from '../i18n'
import './dashboard.scss'

/**
 * رئيسية لوحة التحكم: ترحيب، شو لسا ما انتشر، آخر الطلبات، وبلاطات للأقسام (بصور حقيقية من المحتوى).
 */
type Tile = { href: string; title: string; text: string; slug?: CollectionSlug; imageField?: string; count?: number; images?: string[]; featured?: boolean }

const VERSIONED: { slug: CollectionSlug; titleField: string }[] = [
  { slug: 'success-stories', titleField: 'graduateName' },
  { slug: 'courses', titleField: 'name' },
  { slug: 'news', titleField: 'title' },
  { slug: 'course-groups', titleField: 'name' },
]

const thumb = (m: unknown) => {
  const d = m && typeof m === 'object' ? (m as Media) : undefined
  return d?.sizes?.thumbnail?.url || d?.url || ''
}

async function signingStats() {
  try {
    const [{ getDb }, { documentStats }] = await Promise.all([import('@/features/signing/server/db'), import('@/features/signing/server/repo/documents')])
    return await documentStats(await getDb())
  } catch {
    return null
  }
}

export async function Dashboard(props: ServerProps) {
  const { i18n, payload, user } = props
  if (!payload) return null
  const lang = adminLang(i18n)
  const t = shellText(lang).dash
  const name = (user as { name?: string } | null)?.name || ''
  // Leads (names + phones) and e-signature are for admins only — an editor sees just the content
  const isAdmin = hasRole(user as never, 'admin')
  const none = { docs: [], totalDocs: 0 }

  const find = (slug: CollectionSlug, extra: Record<string, unknown> = {}) =>
    payload
      .find({ collection: slug, limit: 4, depth: 1, locale: lang, sort: 'order', overrideAccess: true, ...extra } as never)
      .catch(() => ({ docs: [], totalDocs: 0 }))

  const [stories, courses, news, staff, partners, leads, newLeads, ...drafts] = await Promise.all([
    find('success-stories'),
    find('courses'),
    find('news', { sort: '-publishedAt' }),
    find('staff'),
    find('partners'),
    isAdmin ? find('leads', { sort: '-createdAt', limit: 5, depth: 1 }) : none,
    isAdmin
      ? payload.count({ collection: 'leads', where: { status: { equals: 'new' } }, overrideAccess: true }).catch(() => ({ totalDocs: 0 }))
      : { totalDocs: 0 },
    ...VERSIONED.map((v) =>
      payload
        .find({ collection: v.slug, where: { _status: { equals: 'draft' } }, draft: true, limit: 50, depth: 0, locale: lang, overrideAccess: true } as never)
        .then((r) => r.docs.map((d) => ({ ...v, label: t.kinds[v.slug] ?? '', id: (d as { id: number }).id, title: String((d as unknown as Record<string, unknown>)[v.titleField] ?? '') })))
        .catch(() => []),
    ),
  ])
  const signing = isAdmin ? await signingStats() : null
  const pending: { slug: string; label: string; id: number | string; title: string; href?: string }[] = (
    drafts as { slug: string; label: string; id: number; title: string }[][]
  ).flat()
  // الصفحة الرئيسية كمان إلها مسودة (تعديل ما انتشر)
  const home = (await payload.findGlobal({ slug: 'homepage', draft: true, depth: 0, overrideAccess: true }).catch(() => null)) as { _status?: string } | null
  if (home?._status === 'draft') pending.unshift({ slug: 'homepage', label: t.kinds.homepage, id: 'homepage', title: t.tiles.homepage[0], href: '/admin/globals/homepage' })

  const pics = (r: { docs: unknown[] }, field: string) => r.docs.map((d) => thumb((d as Record<string, unknown>)[field])).filter(Boolean)
  const tiles = (
  [
    { href: '/admin/media-slots', title: t.tiles.mediaSlots[0], text: t.tiles.mediaSlots[1], featured: true },
    { href: '/admin/collections/success-stories', title: t.tiles.stories[0], text: t.tiles.stories[1], count: stories.totalDocs, images: pics(stories, 'photo') },
    { href: '/admin/collections/courses', title: t.tiles.courses[0], text: t.tiles.courses[1], count: courses.totalDocs, images: pics(courses, 'coverImage') },
    { href: '/admin/collections/news', title: t.tiles.news[0], text: t.tiles.news[1], count: news.totalDocs, images: pics(news, 'coverImage') },
    { href: '/admin/collections/staff', title: t.tiles.staff[0], text: t.tiles.staff[1], count: staff.totalDocs, images: pics(staff, 'photo') },
    { href: '/admin/collections/partners', title: t.tiles.partners[0], text: t.tiles.partners[1], count: partners.totalDocs, images: pics(partners, 'logo') },
    { href: '/admin/globals/homepage', title: t.tiles.homepage[0], text: t.tiles.homepage[1] },
    { href: '/admin/globals/gallery', title: t.tiles.gallery[0], text: t.tiles.gallery[1] },
    { href: '/admin/globals/site-settings', title: t.tiles.settings[0], text: t.tiles.settings[1] },
    isAdmin && {
      href: '/admin/documents',
      title: t.tiles.signing[0],
      text: signing ? t.signingStats(signing.waiting, signing.signed) : t.tiles.signing[1],
      count: signing?.total,
    },
  ] as (Tile | false)[]
  ).filter((t): t is Tile => Boolean(t))

  return (
    <main className="almrkz-dash gutter--left gutter--right">
      <section className="almrkz-dash__hero">
        <div>
          <p className="almrkz-dash__eyebrow">{t.eyebrow}</p>
          <h1>
            {t.hello} {name}
          </h1>
          <p>{t.intro}</p>
        </div>
        <div className="almrkz-dash__status">
          {pending.length ? (
            <>
              <p className="almrkz-dash__status-label">{t.pending}</p>
              <p className="almrkz-dash__status-num">{pending.length}</p>
              <ul>
                {pending.slice(0, 5).map((p) => (
                  <li key={`${p.slug}-${p.id}`}>
                    <Link href={p.href ?? `/admin/collections/${p.slug}/${p.id}`}>
                      {p.label}: {p.title || t.untitled}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="almrkz-dash__ok">{t.upToDate}</p>
          )}
        </div>
      </section>

      <div className={`almrkz-dash__cols${isAdmin ? '' : ' almrkz-dash__cols--full'}`}>
        <section>
          <h2>{t.whatToEdit}</h2>
          <div className="almrkz-dash__tiles">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className={`almrkz-tile${t.featured ? ' almrkz-tile--featured' : ''}`}>
                <span className="almrkz-tile__head">
                  <b>{t.title}</b>
                  {t.count !== undefined && <span className="almrkz-tile__count">{t.count}</span>}
                </span>
                <span className="almrkz-tile__text">{t.text}</span>
                {!!t.images?.length && (
                  <span className="almrkz-tile__imgs">
                    {t.images.slice(0, 4).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" loading="lazy" />
                    ))}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {isAdmin && (
        <aside className="almrkz-dash__leads">
          <h2>
            {t.latestLeads}
            {newLeads.totalDocs > 0 && <span className="almrkz-dash__new">{t.newCount(newLeads.totalDocs)}</span>}
          </h2>
          {leads.docs.length ? (
            <ul>
              {(leads.docs as Lead[]).map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/collections/leads/${l.id}`}>
                    <b>{l.name}</b>
                    <span dir="ltr">{l.phone}</span>
                    <small>
                      {typeof l.course === 'object' && l.course ? (l.course as { name?: string }).name : l.courseOther || ''} ·{' '}
                      {new Date(l.createdAt).toLocaleDateString(t.dateLocale, { day: 'numeric', month: 'short' })}
                    </small>
                    {l.status === 'new' && <em>{t.newBadge}</em>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="almrkz-dash__empty">{t.noLeads}</p>
          )}
          <Link className="almrkz-dash__all" href="/admin/collections/leads">
            {t.allLeads}
          </Link>
        </aside>
        )}
      </div>
    </main>
  )
}
