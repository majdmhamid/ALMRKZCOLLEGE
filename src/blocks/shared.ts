import type { Field, TextareaField, TextField } from 'payload'

/** Small label above a section title (e.g. «الدورات»). The website numbers sections 01, 02… automatically. */
export const kickerField: Field = {
  name: 'kicker',
  label: 'العنوان الصغير فوق القسم',
  type: 'text',
  localized: true,
}

export const titleField: Field = {
  name: 'title',
  label: 'العنوان',
  type: 'text',
  localized: true,
  required: true,
}

export const subtitleField: Field = {
  name: 'subtitle',
  label: 'النص تحت العنوان',
  type: 'textarea',
  localized: true,
}

/** Section id (for menu links like #faq) + temporary hide switch. */
export const sectionSettings = (anchor: string): Field => ({
  type: 'row',
  fields: [
    {
      name: 'anchor',
      label: 'اسم القسم في الرابط',
      type: 'text',
      defaultValue: anchor,
      admin: {
        width: '50%',
        description:
          'تستعمله روابط القائمة (مثل #faq). لا تغيّره إلا إذا غيّرت رابط القائمة أيضاً.',
      },
    },
    {
      name: 'hidden',
      label: 'إخفاء هذا القسم مؤقتاً',
      type: 'checkbox',
      defaultValue: false,
      admin: { width: '50%', description: 'القسم يبقى محفوظاً لكنه لا يظهر في الموقع.' },
    },
  ],
})

export const imageField = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { contains: 'image' } },
  admin: description ? { description } : undefined,
})

export const videoField = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { contains: 'video' } },
  admin: {
    description: description ?? 'فيديو قصير ومضغوط (MP4). انظر الملاحظة في «الصور والفيديو».',
  },
})

export const localizedText = (
  name: string,
  label: string,
  description?: string,
  width?: string,
): TextField => ({
  name,
  label,
  type: 'text',
  localized: true,
  admin: { description, width },
})

export const localizedTextarea = (
  name: string,
  label: string,
  description?: string,
): TextareaField => ({
  name,
  label,
  type: 'textarea',
  localized: true,
  admin: { description },
})

/** Array of {title, text} rows. */
export const titleTextItems = (name: string, label: string, singular: string): Field => ({
  name,
  label,
  type: 'array',
  labels: { singular, plural: label },
  admin: { initCollapsed: true, components: { RowLabel: '@/admin/RowLabel#TitleRowLabel' } },
  fields: [
    { name: 'title', label: 'العنوان', type: 'text', localized: true, required: true },
    { name: 'text', label: 'النص', type: 'textarea', localized: true },
  ],
})
