'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, ValidationError, type GlobalSlug } from 'payload'

import type { SlotOwner } from '@/lib/media-slots'

import { publishDoc } from '../cards/actions'

const LOCALES = ['ar', 'he'] as const
const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', '_status', 'globalType', 'updatedBy', 'createdBy'])

/**
 * «انشر» على «الفيديوهات والصور»: بينشر آخر مسودة للصفحة كلها (العربي والعبري) —
 * نفس «نشر التغييرات» بصفحة التعديل. دورة / قصة نجاح / خبر = publishDoc تبع البطاقات.
 */
export async function publishOwner(owner: SlotOwner): Promise<{ ok: true } | { ok: false; message: string }> {
  if (owner.type === 'collection') return publishDoc(owner.slug, Number(owner.id))
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return { ok: false, message: 'لازم تفوت على اللوحة من جديد (انتهى الدخول).' }
    const slug = owner.slug as GlobalSlug
    for (const locale of LOCALES) {
      const draft = (await payload.findGlobal({
        slug,
        draft: true,
        locale,
        fallbackLocale: false,
        depth: 0,
        user,
        overrideAccess: false,
      })) as unknown as Record<string, unknown>
      const data = Object.fromEntries(Object.entries(draft).filter(([k]) => !SYSTEM_FIELDS.has(k)))
      await payload.updateGlobal({
        slug,
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
    if (e instanceof ValidationError && e.data?.errors?.length) {
      const parts = e.data.errors.map((er) => {
        const label = typeof er.label === 'string' && er.label ? er.label : er.path
        return label.includes(' — ') ? label : `«${label}»: ${er.message}`
      })
      return { ok: false, message: `ما انتشر — في ${parts.length > 1 ? 'خانات' : 'خانة'} لازم تصلّحها بصفحة التعديل: ${parts.join(' · ')}` }
    }
    return { ok: false, message: e instanceof Error ? e.message : String(e) }
  }
}
