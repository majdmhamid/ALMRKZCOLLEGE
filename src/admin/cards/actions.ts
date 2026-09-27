'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type CollectionSlug } from 'payload'

const LOCALES = ['ar', 'he'] as const
const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', '_status', 'updatedBy', 'createdBy'])

async function session() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) throw new Error('unauthorized')
  return { payload, user }
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * ينشر آخر مسودة للعنصر (العربي والعبري) — نفس زر «نشر التغييرات» بصفحة التعديل،
 * بس من البطاقة مباشرة.
 */
export async function publishDoc(collection: string, id: number): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { payload, user } = await session()
    for (const locale of LOCALES) {
      const draft = (await payload.findByID({
        collection: collection as CollectionSlug,
        id,
        draft: true,
        locale,
        fallbackLocale: false,
        depth: 0,
        user,
        overrideAccess: false,
      })) as unknown as Record<string, unknown>
      const data = Object.fromEntries(Object.entries(draft).filter(([k]) => !SYSTEM_FIELDS.has(k)))
      await payload.update({
        collection: collection as CollectionSlug,
        id,
        locale,
        data: { ...data, _status: 'published' } as never,
        draft: false,
        depth: 0,
        user,
        overrideAccess: false,
      })
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, message: message(e) }
  }
}

/** ينشر كل المسودات بهذا القسم (مثلاً كل تعديلات الخريجين) */
export async function publishAll(collection: string): Promise<{ ok: true; count: number } | { ok: false; message: string; count: number }> {
  let count = 0
  try {
    const { payload, user } = await session()
    const drafts = await payload.find({
      collection: collection as CollectionSlug,
      where: { _status: { equals: 'draft' } },
      draft: true,
      depth: 0,
      limit: 500,
      pagination: false,
      user,
      overrideAccess: false,
    })
    for (const doc of drafts.docs) {
      const r = await publishDoc(collection, doc.id as number)
      if (!r.ok) return { ok: false, message: r.message, count }
      count++
    }
    return { ok: true, count }
  } catch (e) {
    return { ok: false, message: message(e), count }
  }
}
