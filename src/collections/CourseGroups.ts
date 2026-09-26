import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { orderField } from '@/fields/order'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'

export const CourseGroups: CollectionConfig = {
  slug: 'course-groups',
  labels: { singular: 'مجموعة دورات', plural: 'مجموعات الدورات' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order', '_status', 'updatedAt'],
    group: 'الدورات',
    description: 'تصنيف الدورات (مثل: الحديد، السلامة، التكييف). كل دورة تتبع مجموعة واحدة.',
    preview: (doc, { locale }) =>
      previewPath({ collection: 'course-groups', slug: doc?.slug as string, locale }),
  },
  defaultSort: 'order',
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 20 },
  fields: [
    {
      name: 'name',
      label: 'اسم المجموعة',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      label: 'وصف قصير',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'image',
      label: 'صورة المجموعة',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'icon',
      label: 'أيقونة (اختياري)',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'صورة صغيرة بسيطة (يُفضّل SVG أو PNG شفّاف).' },
    },
    {
      name: 'courses',
      label: 'الدورات في هذه المجموعة',
      type: 'join',
      collection: 'courses',
      on: 'group',
      defaultSort: 'order',
      admin: { description: 'تُضاف الدورة للمجموعة من صفحة الدورة نفسها.' },
    },
    seoField,
    slugField('name'),
    orderField,
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
