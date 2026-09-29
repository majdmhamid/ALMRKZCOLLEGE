import type { CollectionBeforeDeleteHook, Endpoint, Field, PayloadRequest, SanitizedConfig, Where } from 'payload'
import { APIError } from 'payload'

/**
 * Deleting a picture from the media library silently removed it from every page that used it
 * (a staff photo, a course cover, a homepage video…).
 *
 * - `GET /api/media/in-use?<same where as the delete>` → where each picture is used. The admin asks
 *   «هاي الصورة مستعملة بـ …، متأكد؟» before deleting (src/admin/MediaDeleteGuard.tsx).
 * - The delete itself goes through only with the header `x-media-delete-confirmed: 1` (sent after
 *   that «yes»). Anything else (an old browser tab, a script) gets a clear refusal instead.
 *
 * Field-aware walk over every collection and global (published and draft), so a number that
 * happens to equal an id (an «order», a count) is never mistaken for a picture.
 */

export const CONFIRM_HEADER = 'x-media-delete-confirmed'

type Label = string | Record<string, string> | undefined | ((...a: never[]) => unknown)
type Json = Record<string, unknown>
type Ids = Set<string>

const textOf = (label: Label, lang: string) =>
  typeof label === 'string' ? label : label && typeof label === 'object' ? (label[lang] ?? label.ar ?? Object.values(label)[0]) : ''

/** Media ids referenced by an upload/relationship value */
function refs(v: unknown, out: string[] = []): string[] {
  if (v === null || v === undefined) return out
  if (typeof v === 'number' || typeof v === 'string') out.push(String(v))
  else if (Array.isArray(v)) v.forEach((x) => refs(x, out))
  else if (typeof v === 'object') {
    const o = v as Json
    if ('relationTo' in o) {
      if (o.relationTo === 'media') refs(o.value, out)
    } else if ('id' in o) out.push(String(o.id))
  }
  return out
}

const pointsToMedia = (f: Field) =>
  (f.type === 'upload' || f.type === 'relationship') &&
  (f.relationTo === 'media' || (Array.isArray(f.relationTo) && f.relationTo.includes('media')))

/** Upload nodes inside a rich-text (Lexical) value */
function richTextRefs(node: unknown, ids: Ids, found: Ids) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) return node.forEach((n) => richTextRefs(n, ids, found))
  const o = node as Json
  if (o.type === 'upload' && o.relationTo === 'media') refs(o.value).forEach((id) => ids.has(id) && found.add(id))
  Object.values(o).forEach((v) => v && typeof v === 'object' && richTextRefs(v, ids, found))
}

function collect(fields: Field[], data: unknown, ids: Ids, found: Ids, config: SanitizedConfig) {
  if (!data || typeof data !== 'object') return
  const row = data as Json
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs) collect(tab.fields, 'name' in tab && tab.name ? row[tab.name] : row, ids, found, config)
      continue
    }
    if (f.type === 'row' || f.type === 'collapsible') {
      collect(f.fields, row, ids, found, config)
      continue
    }
    if (!('name' in f) || !f.name) continue
    const raw = row[f.name]
    // locale: 'all' → localized values come as { ar, he }
    const values =
      'localized' in f && f.localized && raw && typeof raw === 'object' && !Array.isArray(raw) && ('ar' in raw || 'he' in raw)
        ? Object.values(raw as Json)
        : [raw]
    for (const v of values) {
      if (pointsToMedia(f)) refs(v).forEach((id) => ids.has(id) && found.add(id))
      else if (f.type === 'richText') richTextRefs(v, ids, found)
      else if (f.type === 'group') collect(f.fields, v, ids, found, config)
      else if (f.type === 'array' && Array.isArray(v)) v.forEach((item) => collect(f.fields, item, ids, found, config))
      else if (f.type === 'blocks' && Array.isArray(v)) {
        for (const item of v as Json[]) {
          const slug = item?.blockType
          const block =
            f.blocks?.find((b) => b.slug === slug) ??
            (f.blockReferences?.includes(slug as never) ? config.blocks?.find((b) => b.slug === slug) : undefined)
          if (block) collect(block.fields, item, ids, found, config)
        }
      }
    }
  }
}

const hasMediaField = (fields: Field[], config: SanitizedConfig): boolean =>
  fields.some((f) => {
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

/** For each media id: the places that show it — «طاقم الكلية: علاء محاميد», «الصفحة الرئيسية» … */
export async function whereMediaIsUsed(req: PayloadRequest, mediaIds: (number | string)[]): Promise<Map<string, string[]>> {
  const { payload } = req
  const config = payload.config
  const lang = req.i18n?.language === 'he' ? 'he' : 'ar'
  const ids: Ids = new Set(mediaIds.map(String))
  const usage = new Map<string, string[]>()
  const add = (found: Ids, place: string) =>
    found.forEach((id) => {
      const list = usage.get(id) ?? []
      if (!list.includes(place)) list.push(place)
      usage.set(id, list)
    })
  if (!ids.size) return usage

  for (const c of config.collections) {
    if (c.slug === 'media' || c.slug.startsWith('payload-') || !hasMediaField(c.fields, config)) continue
    const drafts = Boolean(c.versions && typeof c.versions === 'object' && c.versions.drafts)
    const plural = textOf(c.labels?.plural as Label, lang) || c.slug
    for (const draft of drafts ? [false, true] : [false]) {
      const { docs } = await payload.find({
        collection: c.slug as 'staff',
        depth: 0,
        locale: 'all',
        pagination: false,
        draft,
        overrideAccess: true,
        req,
      })
      for (const doc of docs as unknown as Json[]) {
        const found: Ids = new Set()
        collect(c.fields, doc, ids, found, config)
        if (!found.size) continue
        const titleField = c.admin?.useAsTitle
        const raw = titleField ? doc[titleField] : undefined
        const title = raw && typeof raw === 'object' ? textOf(raw as Label, lang) : String(raw ?? doc.id)
        add(found, `${plural}: ${title}`)
      }
    }
  }
  for (const g of config.globals) {
    if (!hasMediaField(g.fields, config)) continue
    const drafts = Boolean(g.versions && typeof g.versions === 'object' && g.versions.drafts)
    for (const draft of drafts ? [false, true] : [false]) {
      const doc = await payload.findGlobal({ slug: g.slug as 'homepage', depth: 0, locale: 'all', draft, overrideAccess: true, req })
      const found: Ids = new Set()
      collect(g.fields, doc, ids, found, config)
      add(found, textOf(g.label as Label, lang) || g.slug)
    }
  }
  return usage
}

/** GET /api/media/in-use?where[...] (same query as the delete) → { items: [{ id, name, places }] } */
export const mediaInUseEndpoint: Endpoint = {
  path: '/in-use',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    const where = (req.query?.where ?? {}) as Where
    const { docs } = await req.payload.find({
      collection: 'media',
      where,
      depth: 0,
      limit: 500,
      pagination: false,
      overrideAccess: false,
      req,
    })
    const usage = await whereMediaIsUsed(
      req,
      docs.map((d) => d.id),
    )
    const items = docs
      .filter((d) => usage.has(String(d.id)))
      .map((d) => ({ id: d.id, name: (typeof d.alt === 'string' && d.alt) || d.filename || String(d.id), places: usage.get(String(d.id)) }))
    return Response.json({ items }, { headers: { 'cache-control': 'no-store' } })
  },
}

export const refuseDeletingUsedMedia: CollectionBeforeDeleteHook = async ({ id, req }) => {
  // The owner already said «yes» to «هاي الصورة مستعملة بـ …، متأكد؟»
  if (req.headers?.get(CONFIRM_HEADER) === '1') return
  let places: string[] = []
  try {
    places = (await whereMediaIsUsed(req, [id])).get(String(id)) ?? []
  } catch (err) {
    // Never block a delete because the check itself failed
    req.payload.logger.error({ err, msg: 'media in-use check failed' })
    return
  }
  if (!places.length) return
  const list = places.slice(0, 6).join(' · ') + (places.length > 6 ? ' …' : '')
  throw new APIError(
    req.i18n?.language === 'he'
      ? `לא נמחק — הקובץ מופיע באתר: ${list}. החליפו אותו שם קודם, או נסו שוב ואשרו את המחיקה.`
      : `ما انمسحت — الصورة مستعملة بالموقع: ${list}. بدّلها هناك أول، أو جرّب كمان مرة وأكّد المسح.`,
    400,
    undefined,
    true,
  )
}
