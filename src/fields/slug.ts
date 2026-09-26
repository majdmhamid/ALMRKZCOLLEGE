import type { Field, FieldHook } from 'payload'

/**
 * Makes a URL-friendly slug. Arabic/Hebrew letters are kept (modern browsers
 * and Google handle them fine); spaces and symbols become dashes.
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '') // Arabic diacritics (tashkeel)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    const source = data?.[fallbackField] ?? originalDoc?.[fallbackField]
    if (typeof source === 'string' && source.trim()) return slugify(source)
    return value
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
  hooks: { beforeValidate: [formatSlug(fallbackField)] },
})
