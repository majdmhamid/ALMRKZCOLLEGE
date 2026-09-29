import type { CollectionBeforeDeleteHook, Field, PayloadRequest, SanitizedConfig } from 'payload'
import { APIError } from 'payload'

/**
 * Deleting a picture from the media library silently removed it from every page that used it
 * (a staff photo, a course cover, a homepage video…). Now the delete is refused with the list of
 * places, so the owner replaces it there first.
 *
 * Field-aware walk over every collection and global (published and draft), so a number that
 * happens to equal the id (an «order», a count) is never mistaken for the picture.
 */

type Label = string | Record<string, string> | undefined | ((...a: never[]) => unknown)
type Json = Record<string, unknown>

const textOf = (label: Label, lang: string) =>
  typeof label === 'string' ? label : label && typeof label === 'object' ? (label[lang] ?? label.ar ?? Object.values(label)[0]) : ''

const sameId = (v: unknown, id: number | string): boolean => {
  if (v === null || v === undefined) return false
  if (typeof v === 'number' || typeof v === 'string') return String(v) === String(id)
  if (Array.isArray(v)) return v.some((x) => sameId(x, id))
  if (typeof v === 'object') {
    const o = v as Json
    if ('relationTo' in o) return o.relationTo === 'media' && sameId(o.value, id)
    if ('id' in o) return String(o.id) === String(id)
  }
  return false
}

const pointsToMedia = (f: Field) =>
  (f.type === 'upload' || f.type === 'relationship') &&
  (f.relationTo === 'media' || (Array.isArray(f.relationTo) && f.relationTo.includes('media')))

/** Upload nodes inside a rich-text (Lexical) value */
function richTextUses(node: unknown, id: number | string): boolean {
  if (!node || typeof node !== 'object') return false
  if (Array.isArray(node)) return node.some((n) => richTextUses(n, id))
  const o = node as Json
  if (o.type === 'upload' && o.relationTo === 'media' && sameId(o.value, id)) return true
  return Object.values(o).some((v) => v && typeof v === 'object' && richTextUses(v, id))
}

function uses(fields: Field[], data: unknown, id: number | string, config: SanitizedConfig): boolean {
  if (!data || typeof data !== 'object') return false
  const row = data as Json
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs) {
        const inner = 'name' in tab && tab.name ? row[tab.name] : row
        if (uses(tab.fields, inner, id, config)) return true
      }
      continue
    }
    if (f.type === 'row' || f.type === 'collapsible') {
      if (uses(f.fields, row, id, config)) return true
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
      if (pointsToMedia(f)) {
        if (sameId(v, id)) return true
      } else if (f.type === 'richText') {
        if (richTextUses(v, id)) return true
      } else if (f.type === 'group') {
        if (uses(f.fields, v, id, config)) return true
      } else if (f.type === 'array' && Array.isArray(v)) {
        if (v.some((item) => uses(f.fields, item, id, config))) return true
      } else if (f.type === 'blocks' && Array.isArray(v)) {
        for (const item of v as Json[]) {
          const slug = item?.blockType
          const block =
            f.blocks?.find((b) => b.slug === slug) ??
            (f.blockReferences?.includes(slug as never) ? config.blocks?.find((b) => b.slug === slug) : undefined)
          if (block && uses(block.fields, item, id, config)) return true
        }
      }
    }
  }
  return false
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

/** Where this media item is used: «الطاقم: علاء محاميد», «الصفحة الرئيسية للموقع» … */
export async function whereMediaIsUsed(req: PayloadRequest, id: number | string): Promise<string[]> {
  const { payload } = req
  const config = payload.config
  const lang = req.i18n?.language === 'he' ? 'he' : 'ar'
  const places: string[] = []

  for (const c of config.collections) {
    if (c.slug === 'media' || c.slug.startsWith('payload-') || !hasMediaField(c.fields, config)) continue
    const drafts = Boolean(c.versions && typeof c.versions === 'object' && c.versions.drafts)
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
        if (!uses(c.fields, doc, id, config)) continue
        const titleField = c.admin?.useAsTitle
        const raw = titleField ? doc[titleField] : undefined
        const title = raw && typeof raw === 'object' ? textOf(raw as Label, lang) : String(raw ?? doc.id)
        const place = `${textOf(c.labels?.plural as Label, lang) || c.slug}: ${title}`
        if (!places.includes(place)) places.push(place)
      }
    }
  }
  for (const g of config.globals) {
    if (!hasMediaField(g.fields, config)) continue
    const drafts = Boolean(g.versions && typeof g.versions === 'object' && g.versions.drafts)
    for (const draft of drafts ? [false, true] : [false]) {
      const doc = await payload.findGlobal({ slug: g.slug as 'homepage', depth: 0, locale: 'all', draft, overrideAccess: true, req })
      const place = textOf(g.label as Label, lang) || g.slug
      if (uses(g.fields, doc, id, config) && !places.includes(place)) places.push(place)
    }
  }
  return places
}

export const refuseDeletingUsedMedia: CollectionBeforeDeleteHook = async ({ id, req }) => {
  let places: string[] = []
  try {
    places = await whereMediaIsUsed(req, id)
  } catch (err) {
    // Never block a delete because the check itself failed
    req.payload.logger.error({ err, msg: 'media in-use check failed' })
    return
  }
  if (!places.length) return
  const list = places.slice(0, 6).join(req.i18n?.language === 'he' ? ' · ' : ' · ') + (places.length > 6 ? ' …' : '')
  throw new APIError(
    req.i18n?.language === 'he'
      ? `אי אפשר למחוק — הקובץ מופיע באתר: ${list}. החליפו אותו שם קודם, ואז מחקו.`
      : `ما بنقدر نمسحها — مستعملة بالموقع: ${list}. بدّلها هناك أول، وبعدين امسحها.`,
    400,
    undefined,
    true,
  )
}
