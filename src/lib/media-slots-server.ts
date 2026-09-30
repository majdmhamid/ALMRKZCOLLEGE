import type { Block, CollectionSlug, Field, GlobalSlug, Payload, PayloadRequest, SanitizedConfig } from 'payload'

import {
  homepageAnchors,
  ownerKeyOf,
  ownerOrder,
  slotsOf,
  textOf,
  usageFromSlots,
  type Lang,
  type Slot,
} from './media-slots'

/**
 * Reads the pages / collections from the database and turns them into places (src/lib/media-slots.ts).
 * Server only.
 */
type Json = Record<string, unknown>

export type OwnerInfo = {
  ownerKey: string
  /** «الصفحة الرئيسية», «صفحة دورة: اللحام» */
  label: string
  /** Has drafts: a change waits for «انشر». Without: it is on the site right away. */
  versioned: boolean
  /** The latest version is a draft that isn't on the site yet */
  pending: boolean
  editHref: string
}

const pointsToMedia = (f: Field) =>
  (f.type === 'upload' || f.type === 'relationship') &&
  (f.relationTo === 'media' || (Array.isArray(f.relationTo) && f.relationTo.includes('media')))

export function hasMediaField(fields: Field[], config: Pick<SanitizedConfig, 'blocks'>): boolean {
  return fields.some((f) => {
    if (pointsToMedia(f) || f.type === 'richText') return true
    if (f.type === 'tabs') return f.tabs.some((t) => hasMediaField(t.fields, config))
    if ('fields' in f && Array.isArray(f.fields)) return hasMediaField(f.fields, config)
    if (f.type === 'blocks')
      return (
        (f.blocks ?? []).some((b) => hasMediaField(b.fields, config)) ||
        (f.blockReferences ?? []).some((s) => {
          const b = config.blocks?.find((x) => x.slug === (typeof s === 'string' ? s : s.slug))
          return b ? hasMediaField(b.fields, config) : false
        })
      )
    return false
  })
}

const hasDrafts = (versions: unknown) => Boolean(versions && typeof versions === 'object' && (versions as { drafts?: unknown }).drafts)

type LoadOptions = {
  lang?: Lang
  /** true: the latest draft (what the admin edits). false: what visitors see. */
  draft?: boolean
  /** 'all' reads every language (for «مستعمل في» — a picture only in the Hebrew text counts too) */
  locale?: 'all' | Lang
  req?: PayloadRequest
}

/** Every video / picture place of the site, page by page. */
export async function loadSlots(payload: Payload, opts: LoadOptions = {}): Promise<{ slots: Slot[]; owners: Map<string, OwnerInfo> }> {
  const lang = opts.lang ?? 'ar'
  const draft = opts.draft ?? true
  const locale = opts.locale ?? lang
  const { config } = payload
  const blocks = (config.blocks ?? []) as Block[]
  const common = { depth: 0, locale, overrideAccess: true, req: opts.req } as const

  const homepageConfig = config.globals.find((g) => g.slug === 'homepage')
  const homepage = homepageConfig
    ? ((await payload.findGlobal({ slug: 'homepage' as GlobalSlug, draft, ...common }).catch(() => null)) as Json | null)
    : null
  const anchors = homepageConfig ? homepageAnchors(homepageConfig.fields, homepage, blocks) : {}

  // every collection with a picture / video field, read once (also gives the names for «الدورة: …»)
  const collections = config.collections.filter((c) => c.slug !== 'media' && !c.slug.startsWith('payload-') && hasMediaField(c.fields, config))
  const docs = new Map<string, Json[]>()
  // one after the other: the database pool is small (payload.config.ts), and a delete runs this
  // inside its own transaction
  for (const c of collections) {
    const res = await payload
      .find({ collection: c.slug as CollectionSlug, pagination: false, draft: draft && hasDrafts(c.versions), sort: c.defaultSort ?? 'id', ...common } as never)
      .catch(() => ({ docs: [] }))
    docs.set(c.slug, res.docs as unknown as Json[])
  }
  const titleCache = new Map<string, Map<string, string>>()
  const titles = (collection: string, id: number | string) => {
    let map = titleCache.get(collection)
    if (!map) {
      map = new Map()
      const c = config.collections.find((x) => x.slug === collection)
      const field = c?.admin?.useAsTitle ?? 'name'
      for (const d of docs.get(collection) ?? []) {
        const v = d[field]
        const s = typeof v === 'string' ? v : v && typeof v === 'object' ? textOf(v, lang) : ''
        if (s) map.set(String(d.id), s)
      }
      titleCache.set(collection, map)
    }
    return map.get(String(id))
  }
  const slots: Slot[] = []
  const owners = new Map<string, OwnerInfo>()

  for (const g of config.globals) {
    if (!hasMediaField(g.fields, config)) continue
    const versioned = hasDrafts(g.versions)
    const doc =
      g.slug === 'homepage'
        ? homepage
        : ((await payload.findGlobal({ slug: g.slug as GlobalSlug, draft: draft && versioned, ...common }).catch(() => null)) as Json | null)
    if (!doc) continue
    const owner = { type: 'global' as const, slug: g.slug }
    const found = slotsOf({ owner, fields: g.fields, doc, lang, titles, blocks, anchors, ownerLabel: { singular: textOf(g.label, lang) } })
    slots.push(...found)
    owners.set(ownerKeyOf(owner), {
      ownerKey: ownerKeyOf(owner),
      label: found[0]?.trail[0] ?? textOf(g.label, lang),
      versioned,
      pending: versioned && doc._status === 'draft',
      editHref: `/admin/globals/${g.slug}`,
    })
  }

  for (const c of collections) {
    const versioned = hasDrafts(c.versions)
    for (const doc of docs.get(c.slug) ?? []) {
      const owner = { type: 'collection' as const, slug: c.slug, id: doc.id as number }
      const found = slotsOf({
        owner,
        fields: c.fields,
        doc,
        lang,
        titles,
        blocks,
        anchors,
        ownerLabel: { singular: textOf(c.labels?.singular, lang), plural: textOf(c.labels?.plural, lang), useAsTitle: c.admin?.useAsTitle },
      })
      slots.push(...found)
      owners.set(ownerKeyOf(owner), {
        ownerKey: ownerKeyOf(owner),
        label: found[0]?.trail[0] ?? String(doc.id),
        versioned,
        pending: versioned && doc._status === 'draft',
        editHref: `/admin/collections/${c.slug}/${doc.id}`,
      })
    }
  }

  // page by page (OWNERS order); inside a page, the order of the page
  const order = new Map(slots.map((s, i) => [s, i]))
  slots.sort((a, b) => ownerOrder(a.owner.slug) - ownerOrder(b.owner.slug) || order.get(a)! - order.get(b)!)
  return { slots, owners }
}

export type Place = { label: string; href: string }

/** Link to the place on «الفيديوهات والصور» */
export const hubHref = (key: string) => `/admin/media-slots?focus=${encodeURIComponent(key)}`

/**
 * For each media id: where it is used — on the site now or in a draft (both count: a draft
 * becomes the site with one click on «انشر»). `ids` null = all media.
 */
export async function mediaUsage(
  payload: Payload,
  ids: (number | string)[] | null,
  opts: { lang?: Lang; req?: PayloadRequest } = {},
): Promise<Map<string, Place[]>> {
  const lang = opts.lang ?? 'ar'
  const published = await loadSlots(payload, { lang, draft: false, locale: 'all', req: opts.req })
  const latest = await loadSlots(payload, { lang, draft: true, locale: 'all', req: opts.req })
  const usage = usageFromSlots([...latest.slots, ...published.slots])
  const wanted = ids ? new Set(ids.map(String)) : null
  const out = new Map<string, Place[]>()
  for (const [id, places] of usage) {
    if (wanted && !wanted.has(id)) continue
    out.set(
      id,
      places.map((p) => ({ label: p.label, href: hubHref(p.key) })),
    )
  }
  return out
}

/**
 * Same, remembered for a few seconds: the media list asks once per row (one walk for the page).
 */
let memo: { at: number; lang: Lang; payload: Payload; value: Promise<Map<string, Place[]>> } | null = null
export function allMediaUsage(payload: Payload, lang: Lang = 'ar'): Promise<Map<string, Place[]>> {
  const now = Date.now()
  if (memo && memo.payload === payload && memo.lang === lang && now - memo.at < 5000) return memo.value
  const value = mediaUsage(payload, null, { lang }).catch((err) => {
    payload.logger.error({ err, msg: 'media usage failed' })
    memo = null
    return new Map<string, Place[]>()
  })
  memo = { at: now, lang, payload, value }
  return value
}
