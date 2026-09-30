'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload'

import { labelFor } from '@/hooks/enforceContentRules'
import { groupState, type GroupState } from '@/lib/group-visibility'

const LOCALES = ['ar', 'he'] as const
const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', '_status', 'updatedBy', 'createdBy'])
const TITLE_FIELD: Record<string, string> = {
  courses: 'name',
  'course-groups': 'name',
  news: 'title',
  'success-stories': 'graduateName',
}

async function session() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) throw new Error('unauthorized')
  return { payload, user }
}

/**
 * رسالة مفهومة: اسم الخانة بالعربي وشو الغلط — مش «slug» أو اسم تقني.
 * (خطأ «القيمة لازم تكون فريدة» من القاعدة ما فيه اسم الخانة، فمنجيبه من إعدادات القسم.)
 */
function explain(e: unknown, payload: Payload | undefined, collection: string): string {
  if (e instanceof ValidationError && e.data?.errors?.length) {
    const fields = payload?.collections[collection as CollectionSlug]?.config.fields
    const parts = e.data.errors.map((er) => {
      const label = typeof er.label === 'string' && er.label ? er.label : (labelFor(fields, er.path) ?? er.path)
      // قواعد الكلية (سعر / وعد تشغيل) بتكتب الشرح كامل بالـ label
      return label.includes(' — ') ? label : `«${label}»: ${er.message}`
    })
    return `في ${parts.length > 1 ? 'خانات' : 'خانة'} لازم تصلّحها — ${parts.join(' · ')}`
  }
  return e instanceof Error ? e.message : String(e)
}

/**
 * ينشر آخر مسودة للعنصر (العربي والعبري) — نفس زر «نشر التغييرات» بصفحة التعديل،
 * بس من البطاقة مباشرة.
 */
export async function publishDoc(
  collection: string,
  id: number,
): Promise<{ ok: true; groupState?: GroupState } | { ok: false; message: string }> {
  let payload: Payload | undefined
  /** اللغة اللي عم تنتشر هلأ — إذا الغلط بالعبري منحكي هيك (مثلاً اسم الخريج بالعبري فاضي) */
  let at: (typeof LOCALES)[number] = 'ar'
  try {
    const s = await session()
    payload = s.payload
    const { user } = s
    for (const locale of LOCALES) {
      at = locale
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
    if (collection === 'course-groups') {
      // مجال بدون دورة منشورة بينحفظ بس ما بيبين بالموقع — منحكيله هيك (lib/group-visibility.ts)
      const { totalDocs } = await payload.count({
        collection: 'courses',
        where: { and: [{ group: { equals: id } }, { _status: { equals: 'published' } }] },
        overrideAccess: true,
      })
      return { ok: true, groupState: groupState('published', totalDocs > 0) }
    }
    return { ok: true }
  } catch (e) {
    const message = explain(e, payload, collection)
    return {
      ok: false,
      message: at === 'he' && e instanceof ValidationError ? `النسخة العبرية ناقصة — ${message} (عبّيها بالسطر «עברית» تحت البطاقة، أو بصفحة التعديل ✎)` : message,
    }
  }
}

/**
 * ينشر كل المسودات بهذا القسم (مثلاً كل تعديلات الخريجين).
 * عنصر فيه خانة ناقصة ما بيوقّف الباقي — بينشر الباقي وبيحكي مين ما انتشر وليش.
 */
export async function publishAll(
  collection: string,
): Promise<{ ok: true; count: number } | { ok: false; message: string; count: number }> {
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
    const failed: string[] = []
    for (const doc of drafts.docs) {
      const r = await publishDoc(collection, doc.id as number)
      if (r.ok) count++
      else {
        const title = String((doc as unknown as Record<string, unknown>)[TITLE_FIELD[collection] ?? 'name'] ?? '').trim()
        failed.push(`«${title || 'بدون اسم'}»: ${r.message}`)
      }
    }
    return failed.length ? { ok: false, message: `ما انتشر ${failed.length}: ${failed.join(' | ')}`, count } : { ok: true, count }
  } catch (e) {
    return { ok: false, message: explain(e, undefined, collection), count }
  }
}
