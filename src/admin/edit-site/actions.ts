'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, ValidationError, type CollectionSlug, type GlobalSlug } from 'payload'

import { labelFor } from '@/hooks/enforceContentRules'
import { docOf, VERSIONED_DOCS } from '@/lib/edit-marks'

import { publishDoc } from '../cards/actions'

const LOCALES = ['ar', 'he'] as const
const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', '_status', 'updatedBy', 'createdBy', 'globalType'])

/** Names of the documents with unpublished changes, for the list under «عندك N تغييرات». */
const KINDS: { slug: CollectionSlug; title: string; label: string }[] = [
  { slug: 'courses', title: 'name', label: 'دورة' },
  { slug: 'course-groups', title: 'name', label: 'مجال' },
  { slug: 'news', title: 'title', label: 'خبر' },
  { slug: 'success-stories', title: 'graduateName', label: 'خريج' },
]

async function session() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) throw new Error('لازم تسجّل دخول للوحة التحكم من جديد.')
  return { payload, user }
}

export type PendingDoc = { d: string; label: string }

/** Everything that has a draft not published yet (also drafts started in the full forms). */
export async function listPending(): Promise<PendingDoc[]> {
  const { payload, user } = await session()
  const out: PendingDoc[] = []
  const home = (await payload
    .findGlobal({ slug: 'homepage', draft: true, depth: 0, user, overrideAccess: false })
    .catch(() => null)) as { _status?: string } | null
  if (home?._status === 'draft') out.push({ d: 'homepage', label: 'الصفحة الرئيسية' })
  for (const k of KINDS) {
    const { docs } = await payload
      .find({
        collection: k.slug,
        where: { _status: { equals: 'draft' } },
        draft: true,
        depth: 0,
        limit: 100,
        pagination: false,
        locale: 'ar',
        user,
        overrideAccess: false,
      })
      .catch(() => ({ docs: [] as unknown[] }))
    for (const doc of docs as Record<string, unknown>[]) {
      out.push({ d: `${k.slug}/${doc.id}`, label: `${k.label}: ${String(doc[k.title] ?? '').trim() || 'بدون اسم'}` })
    }
  }
  return out
}

/** Publishes the latest draft of a page (global) in both languages — like «نشر التغييرات». */
async function publishGlobal(slug: string): Promise<string | null> {
  const { payload, user } = await session()
  try {
    for (const locale of LOCALES) {
      const draft = (await payload.findGlobal({
        slug: slug as GlobalSlug,
        draft: true,
        locale,
        fallbackLocale: false,
        depth: 0,
        user,
        overrideAccess: false,
      })) as unknown as Record<string, unknown>
      const data = Object.fromEntries(Object.entries(draft).filter(([k]) => !SYSTEM_FIELDS.has(k)))
      await payload.updateGlobal({
        slug: slug as GlobalSlug,
        locale,
        data: { ...data, _status: 'published' } as never,
        draft: false,
        depth: 0,
        user,
        overrideAccess: false,
      })
    }
    return null
  } catch (e) {
    if (e instanceof ValidationError && e.data?.errors?.length) {
      const fields = payload.globals.config.find((g) => g.slug === slug)?.fields
      const parts = e.data.errors.map((er) => {
        const label = typeof er.label === 'string' && er.label ? er.label : (labelFor(fields, er.path) ?? er.path)
        return label.includes(' — ') ? label : `«${label}»: ${er.message}`
      })
      return `في خانة لازم تصلّحها — ${parts.join(' · ')}`
    }
    return e instanceof Error ? e.message : String(e)
  }
}

/**
 * «انشر التغييرات»: publishes every document in the list (latest draft, Arabic + Hebrew).
 * One that fails doesn't stop the others — the answer says which and why.
 */
export async function publishDocs(
  docs: string[],
): Promise<{ published: string[]; failed: { d: string; message: string }[] }> {
  await session()
  const published: string[] = []
  const failed: { d: string; message: string }[] = []
  for (const d of [...new Set(docs)]) {
    if (!VERSIONED_DOCS.has(d.split('/')[0])) continue
    const doc = docOf(d)
    const message =
      'collection' in doc
        ? await publishDoc(doc.collection, Number(doc.id)).then((r) => (r.ok ? null : r.message))
        : await publishGlobal(doc.global)
    if (message) failed.push({ d, message })
    else published.push(d)
  }
  return { published, failed }
}
