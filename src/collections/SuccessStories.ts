import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { orderField } from '@/fields/order'
import { slugField } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'
import { APPROVED_EMPLOYMENT_WORDING } from '@/lib/rules'

export const SuccessStories: CollectionConfig = {
  slug: 'success-stories',
  labels: { singular: 'قصة نجاح', plural: 'قصص نجاح الخريجين' },
  admin: {
    useAsTitle: 'graduateName',
    defaultColumns: ['graduateName', 'course', 'graduationYear', '_status'],
    group: 'أخبار وقصص',
    description: 'قصص خريجين حقيقيين — بموافقتهم على نشر الاسم والصورة.',
    preview: (doc, { locale }) =>
      previewPath({ collection: 'success-stories', slug: doc?.slug as string, locale }),
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
    { name: 'graduateName', label: 'اسم الخريج/ة', type: 'text', localized: true, required: true },
    {
      name: 'course',
      label: 'الدورة التي أنهاها',
      type: 'relationship',
      relationTo: 'courses',
    },
    { name: 'graduationYear', label: 'سنة التخرّج', type: 'number', min: 2008, max: 2100 },
    {
      name: 'photo',
      label: 'صورة الخريج/ة',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'quote',
      label: 'اقتباس قصير (بكلماته)',
      type: 'textarea',
      localized: true,
      required: true,
      maxLength: 280,
    },
    {
      name: 'currentRole',
      label: 'ماذا يعمل اليوم (اختياري)',
      type: 'text',
      localized: true,
      admin: {
        description:
          'حقيقة عن الخريج فقط (مثال: «يعمل اليوم كلحّام في شركة بناء»). ' +
          APPROVED_EMPLOYMENT_WORDING,
      },
    },
    { name: 'story', label: 'القصة الكاملة (اختياري)', type: 'richText', localized: true },
    {
      name: 'video',
      label: 'فيديو (اختياري)',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'video' } },
      admin: { description: 'فيديو قصير ومضغوط (أقل من دقيقة، MP4).' },
    },
    {
      name: 'featured',
      label: 'تظهر في الصفحة الرئيسية',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    slugField('graduateName'),
    orderField,
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
