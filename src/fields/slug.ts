import type { CollectionSlug, Field, FieldHook, PayloadRequest, Where } from 'payload'

/**
 * Makes a URL-friendly slug. Arabic/Hebrew letters are kept (modern browsers
 * and Google handle them fine); spaces and symbols become dashes.
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '') // Arabic diacritics (tashkeel)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

/**
 * `base`, or `base-2`, `base-3`… — the first one no other document of this collection uses.
 * (The slug column is unique: a clash would stop the save with a technical error.)
 */
export async function freeSlug(
  req: PayloadRequest,
  collection: string | undefined,
  base: string,
  ownId?: number | string,
): Promise<string> {
  if (!collection || !req?.payload) return base
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const where: Where = { slug: { equals: candidate } }
    if (ownId !== undefined && ownId !== null) where.id = { not_equals: ownId }
    const { totalDocs } = await req.payload.count({
      collection: collection as CollectionSlug,
      where,
      req,
      overrideAccess: true,
    })
    if (!totalDocs) return candidate
  }
  return `${base}-${Date.now()}`
}

const formatSlug =
  (fallbackField: string): FieldHook =>
  async ({ value, data, originalDoc, req, collection }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    const source = data?.[fallbackField] ?? originalDoc?.[fallbackField]
    if (typeof source === 'string' && source.trim()) {
      // Made from the name automatically: pick a free one (two news items can have the same
      // title — the second gets «…-2» instead of a save error).
      const slug = slugify(source)
      return slug ? freeSlug(req, collection?.slug, slug, originalDoc?.id ?? data?.id) : value
    }
    return value
  }

/**
 * «استنساخ» (duplicate) copies everything — also the slug, which must stay unique.
 * Payload's default only appends « - Copy» once, so duplicating the same item twice failed.
 */
export const duplicateSlug: FieldHook = async ({ value, req, collection }) => {
  if (typeof value !== 'string' || !value.trim()) return undefined
  return freeSlug(req, collection?.slug, `${slugify(value)}-copy`)
}

/**
 * Not localized: one address per page, shared by /ar/... and /he/...
 * Filled automatically from `fallbackField` (in Arabic) when left empty.
 */
export const slugField = (fallbackField = 'name'): Field => ({
  name: 'slug',
  label: 'الرابط (slug)',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description:
      'الجزء الأخير من عنوان الصفحة على الإنترنت. إذا تركته فارغاً يُملأ تلقائياً من الاسم. لا تغيّره بعد النشر حتى لا تنكسر الروابط القديمة.',
  },
  hooks: { beforeValidate: [formatSlug(fallbackField)], beforeDuplicate: [duplicateSlug] },
})
