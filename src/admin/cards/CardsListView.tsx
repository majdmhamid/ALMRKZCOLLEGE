import { DefaultListView } from '@payloadcms/ui'
import type { ListViewClientProps, ListViewServerProps, Where } from 'payload'
import React from 'react'

import type { Course, CourseGroup, Media, News, Partner, Staff, SuccessStory } from '@/payload-types'
import '../site-scoped.css'
import './cards.scss'
import { CardsGrid } from './CardsGrid'
import type { Card, CardKind, Locale } from './types'

/**
 * بدل الجدول: نفس بطاقات الموقع، والتعديل عليها مباشرة.
 * «عرض كجدول» (?view=table) بيرجع جدول Payload العادي للبحث والفلترة.
 * داخل النوافذ (اختيار عنصر من علاقة) بيضل الجدول العادي.
 */
const CLIENT_KEYS = [
  'beforeActions',
  'collectionSlug',
  'columnState',
  'disableBulkDelete',
  'disableBulkEdit',
  'disableQueryPresets',
  'enableRowSelections',
  'hasCreatePermission',
  'hasDeletePermission',
  'hasTrashPermission',
  'listPreferences',
  'newDocumentURL',
  'queryPreset',
  'queryPresetPermissions',
  'renderedFilters',
  'resolvedFilterOptions',
  'viewType',
  'AfterList',
  'AfterListTable',
  'BeforeList',
  'BeforeListTable',
  'Description',
  'listMenuItems',
  'Table',
] as const

const KINDS: Record<string, CardKind> = {
  'success-stories': 'stories',
  staff: 'staff',
  partners: 'partners',
  courses: 'courses',
  news: 'news',
  'course-groups': 'groups',
}

const asDoc = <T,>(v: unknown): T | undefined => (v && typeof v === 'object' ? (v as T) : undefined)
const mediaUrl = (m: unknown, size?: 'thumbnail' | 'card' | 'wide') => {
  const doc = asDoc<Media>(m)
  return (size && doc?.sizes?.[size]?.url) || doc?.url || ''
}
const mediaId = (m: unknown) => (typeof m === 'number' ? m : asDoc<Media>(m)?.id ?? null)

export async function CardsListView(props: ListViewServerProps) {
  const { collectionConfig, payload, locale, user, searchParams, viewType } = props
  const kind = KINDS[collectionConfig.slug]
  const tableMode = !kind || viewType !== 'list' || searchParams?.view === 'table'
  if (tableMode) {
    const clientProps = Object.fromEntries(CLIENT_KEYS.filter((k) => k in props).map((k) => [k, props[k as keyof typeof props]]))
    return (
      <>
        {kind && viewType === 'list' && <BackToCards slug={collectionConfig.slug} />}
        <DefaultListView {...(clientProps as unknown as ListViewClientProps)} />
      </>
    )
  }

  const code = (locale?.code === 'he' ? 'he' : 'ar') as Locale
  const other: Locale = code === 'ar' ? 'he' : 'ar'
  const slug = collectionConfig.slug as 'courses'
  const versioned = Boolean(collectionConfig.versions && (collectionConfig.versions as { drafts?: unknown }).drafts)
  const sort = kind === 'news' ? '-publishedAt' : 'order'
  const base = { collection: slug, draft: true, limit: 500, pagination: false, sort, user, overrideAccess: false } as const
  const [cur, oth, ui] = await Promise.all([
    payload.find({ ...base, locale: code, depth: 1 }),
    payload.find({ ...base, locale: other, depth: 0, fallbackLocale: false }),
    payload.findGlobal({ slug: 'ui-texts', locale: code, depth: 0 }).catch(() => null),
  ])
  const otherById = new Map(oth.docs.map((d) => [d.id, d as unknown as Record<string, unknown>]))

  // خيارات قوائم الاختيار (الدورة اللي خلّصها الخريج، المجال)
  let courseOptions: { value: number; label: string; group?: string }[] = []
  if (kind === 'stories') {
    const all = await payload.find({ collection: 'courses', locale: code, depth: 1, limit: 300, pagination: false, sort: 'order', draft: true, user, overrideAccess: false })
    courseOptions = all.docs.map((c) => ({ value: c.id, label: c.name, group: asDoc<CourseGroup>(c.group)?.name }))
  }

  // النجمة ☆ بتقرّر مين بيظهر بالرئيسية — إلا إذا قسم الرئيسية فيه اختيار يدوي
  let flagNote = ''
  if (kind === 'stories' || kind === 'courses') {
    const home = (await payload.findGlobal({ slug: 'homepage', depth: 0 }).catch(() => null)) as {
      sections?: { blockType?: string; hidden?: boolean | null; stories?: unknown[] | null; courses?: unknown[] | null }[] | null
    } | null
    const block = home?.sections?.find((b) => b.blockType === (kind === 'stories' ? 'successStories' : 'featuredCourses'))
    const chosen = kind === 'stories' ? block?.stories : block?.courses
    if (block && !block.hidden && chosen?.length) {
      flagNote =
        kind === 'stories'
          ? `انتبه: قسم «قصص نجاح» بالصفحة الرئيسية معمول فيه اختيار يدوي (${chosen.length} خريجين)، فالنجمة ☆ هون ما بتغيّر شي. لتغيير مين بيظهر: «الصفحة الرئيسية للموقع» ← قسم «قصص نجاح» ← «القصص المعروضة» (أو فضّيها لترجع النجمة تشتغل).`
          : `انتبه: قسم «أبرز الدورات» بالصفحة الرئيسية معمول فيه اختيار يدوي (${chosen.length} دورات)، فالنجمة ☆ هون ما بتغيّر شي. لتغيير الدورات: «الصفحة الرئيسية للموقع» ← قسم «أبرز الدورات» ← «الدورات المعروضة» (أو فضّيها لترجع النجمة تشتغل).`
    }
  }

  const cards: Card[] = cur.docs.map((raw) => {
    const d = raw as unknown as Record<string, unknown>
    const o = otherById.get(raw.id) ?? {}
    const status = (d._status as Card['status']) ?? undefined
    const common = { id: raw.id, order: Number(d.order ?? 0), status }
    switch (kind) {
      case 'stories': {
        const s = raw as unknown as SuccessStory
        return {
          ...common,
          title: s.graduateName ?? '',
          titleOther: String(o.graduateName ?? ''),
          text: s.quote ?? '',
          textOther: String(o.quote ?? ''),
          sub: s.currentRole ?? '',
          image: mediaUrl(s.photo, 'card'),
          imageId: mediaId(s.photo),
          relation: asDoc<Course>(s.course)?.id ?? (typeof s.course === 'number' ? s.course : null),
          relationLabel: asDoc<Course>(s.course)?.name ?? '',
          flag: Boolean(s.featured),
        }
      }
      case 'staff': {
        const s = raw as unknown as Staff
        return { ...common, title: s.name ?? '', titleOther: String(o.name ?? ''), sub: s.role ?? '', subOther: String(o.role ?? ''), text: s.bio ?? '', image: mediaUrl(s.photo, 'card'), imageId: mediaId(s.photo) }
      }
      case 'partners': {
        const p = raw as unknown as Partner
        return { ...common, title: p.name ?? '', titleOther: String(o.name ?? ''), image: mediaUrl(p.logo), imageId: mediaId(p.logo), url: p.url ?? '' }
      }
      case 'courses': {
        const c = raw as unknown as Course
        return {
          ...common,
          title: c.name ?? '',
          titleOther: String(o.name ?? ''),
          sub: c.shortDescription ?? '',
          subOther: String(o.shortDescription ?? ''),
          image: mediaUrl(c.coverImage, 'card'),
          imageId: mediaId(c.coverImage),
          relationLabel: asDoc<CourseGroup>(c.group)?.name ?? '',
          hours: c.hours ?? null,
          sessions: c.sessions ?? null,
          flag: Boolean((c as unknown as { featured?: boolean }).featured),
          voucher: Boolean(c.voucherEligible),
        }
      }
      case 'news': {
        const n = raw as unknown as News
        return { ...common, title: n.title ?? '', titleOther: String(o.title ?? ''), sub: n.excerpt ?? '', subOther: String(o.excerpt ?? ''), image: mediaUrl(n.coverImage, 'card'), imageId: mediaId(n.coverImage), date: n.publishedAt, flag: Boolean(n.pinned) }
      }
      case 'groups': {
        const g = raw as unknown as CourseGroup
        return { ...common, title: g.name ?? '', titleOther: String(o.name ?? ''), sub: g.tagline ?? '', subOther: String(o.tagline ?? ''), image: mediaUrl(g.image, 'card'), imageId: mediaId(g.image), icon: mediaUrl(g.icon) }
      }
    }
  })

  const u = (ui ?? {}) as { common?: Record<string, string | null | undefined>; trust?: { title?: string | null }[] }
  const labels = {
    hours: u.common?.hours ?? 'ساعة',
    sessions: u.common?.sessions ?? 'لقاء',
    evening: u.common?.evening ?? '',
    viewCourse: u.common?.viewCourse ?? '',
    readMore: u.common?.readMore ?? '',
    voucher: u.trust?.[3]?.title ?? '',
  }
  const description = typeof collectionConfig.admin.description === 'string' ? collectionConfig.admin.description : ''
  const plural = typeof collectionConfig.labels.plural === 'string' ? collectionConfig.labels.plural : collectionConfig.slug

  return (
    <CardsGrid
      kind={kind}
      collection={collectionConfig.slug}
      title={plural}
      description={description}
      cards={cards}
      locale={code}
      versioned={versioned}
      labels={labels}
      courseOptions={courseOptions}
      flagNote={flagNote}
      canCreate={Boolean(props.hasCreatePermission)}
      canDelete={props.hasDeletePermission !== false}
    />
  )
}

/** رابط رجوع من وضع الجدول لوضع البطاقات */
function BackToCards({ slug }: { slug: string }) {
  return (
    <div className="gutter--left gutter--right" style={{ paddingTop: 16 }}>
      <a href={`/admin/collections/${slug}`} className="cards-back">
        ← رجوع لعرض البطاقات
      </a>
    </div>
  )
}

export type { Where }
