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
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'graduateName',
    defaultColumns: ['graduateName', 'course', 'graduationYear', '_status'],
    group: 'أخبار وقصص',
    description:
      'خريجون حقيقيون — بموافقتهم على نشر الاسم والصورة والقصة. لا تنشر قصة لم يؤكّدها الخريج نفسه.',
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
      maxLength: 280,
      admin: { description: 'بدونه يظهر الخريج بالصورة والاسم فقط (بدون قصة).' },
    },
    {
      name: 'excerpt',
      label: 'القصة باختصار',
      type: 'textarea',
      localized: true,
      maxLength: 500,
      admin: { description: '2–3 جمل تظهر تحت الاقتباس في الصفحة الرئيسية.' },
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
      name: 'videoDuration',
      label: 'مدة الفيديو',
      type: 'text',
      admin: { description: 'مثال: 1:12' },
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
