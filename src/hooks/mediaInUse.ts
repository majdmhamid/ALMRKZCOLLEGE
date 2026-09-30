import type { CollectionBeforeDeleteHook, Endpoint, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'

import { mediaUsage } from '@/lib/media-slots-server'

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
 * happens to equal an id (an «order», a count) is never mistaken for a picture
 * (src/lib/media-slots.ts — the same walk as the «الفيديوهات والصور» page).
 */

export const CONFIRM_HEADER = 'x-media-delete-confirmed'

/**
 * For each media id: the places that show it, in the words of «الفيديوهات والصور»
 * («الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: …») — src/lib/media-slots.ts.
 */
export async function whereMediaIsUsed(req: PayloadRequest, mediaIds: (number | string)[]): Promise<Map<string, string[]>> {
  if (!mediaIds.length) return new Map()
  const usage = await mediaUsage(req.payload, mediaIds, { lang: req.i18n?.language === 'he' ? 'he' : 'ar', req })
  return new Map([...usage].map(([id, places]) => [id, places.map((p) => p.label)]))
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
