import type { Field } from 'payload'

/** Optional per-page search-engine texts. Empty = use the defaults from «إعدادات الموقع». */
export const seoField: Field = {
  name: 'seo',
  label: 'ظهور في جوجل (SEO)',
  type: 'group',
  admin: {
    description: 'اختياري. إذا تركته فارغاً تُستعمل الإعدادات العامة للموقع.',
  },
  fields: [
    {
      name: 'title',
      label: 'عنوان الصفحة في جوجل',
      type: 'text',
      localized: true,
      maxLength: 70,
    },
    {
      name: 'description',
      label: 'وصف قصير في جوجل',
      type: 'textarea',
      localized: true,
      maxLength: 170,
    },
    {
      name: 'image',
      label: 'صورة المشاركة (واتساب/فيسبوك)',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
  ],
}
