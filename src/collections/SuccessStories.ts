import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { orderField } from '@/fields/order'
import { slugField } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { validateFeatured } from '@/lib/home-stories'
import { previewPath } from '@/lib/preview'
import { APPROVED_EMPLOYMENT_WORDING } from '@/lib/rules'

/*
 * ترتيب الفورم: الأساسي فوق (مين، صورة، دورة، سنة، اقتباس، «اعرضها بالرئيسية»)،
 * والباقي تحت بـ«تفاصيل إضافية (اختياري)». الصفوف (row) والطيّ (collapsible) للعرض بس —
 * أسماء الخانات بالقاعدة ما تغيّرت (بدون migration).
 */
export const SuccessStories: CollectionConfig = {
  slug: 'success-stories',
  labels: { singular: 'قصة نجاح', plural: 'قصص نجاح الخريجين' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'graduateName',
    defaultColumns: ['graduateName', 'course', 'graduationYear', 'featured', '_status'],
    group: 'أخبار وقصص',
    description:
      'خريجون حقيقيون — بموافقتهم على نشر الاسم والصورة والقصة. لا تنشر قصة لم يؤكّدها الخريج نفسه. ' +
      'لتطلع قصة بالصفحة الرئيسية: اضغط «اعرضها بالرئيسية» على بطاقتها، وبعدين «انشر».',
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
    {
      name: 'featured',
      label: 'اعرضها بالرئيسية',
      type: 'checkbox',
      defaultValue: false,
      validate: validateFeatured,
      admin: {
        description:
          '✓ = القصة بتطلع بقسم «قصص نجاح» بالصفحة الرئيسية (بعد «انشر»)، بالترتيب اللي على صفحة قصص النجاح. ' +
          'بدون ✓ القصة بتضل محفوظة بس ما بتطلع بالرئيسية.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'graduateName',
          label: 'اسم الخريج/ة',
          type: 'text',
          localized: true,
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'course',
          label: 'الدورة التي أنهاها',
          type: 'relationship',
          relationTo: 'courses',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'graduationYear',
          label: 'سنة التخرّج',
          type: 'number',
          min: 2008,
          max: 2100,
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'photo',
      label: 'صورة الخريج/ة',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'لازم صورة إذا القصة معروضة بالرئيسية. صورة طولية (واقف) بتطلع أحلى.' },
    },
    {
      name: 'quote',
      label: 'اقتباس قصير (بكلماته)',
      type: 'textarea',
      localized: true,
      maxLength: 280,
      admin: {
        description:
          'جملة أو جملتين بكلمات الخريج. اختياري — بدونه بتطلع «القصة باختصار» (أو الصورة والاسم والدورة بس).',
      },
    },
    {
      name: 'excerpt',
      label: 'القصة باختصار (اختياري)',
      type: 'textarea',
      localized: true,
      maxLength: 500,
      admin: { description: '2–3 جمل بتطلع تحت الاقتباس بالصفحة الرئيسية.' },
    },
    {
      type: 'collapsible',
      label: 'تفاصيل إضافية (اختياري)',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'currentRole',
          label: 'شو بيشتغل اليوم (اختياري)',
          type: 'text',
          localized: true,
          admin: {
            description:
              'حقيقة عن الخريج بس (مثال: «بيشتغل اليوم لحّام بشركة بناء»). ' +
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
          admin: { description: 'فيديو قصير ومضغوط (أقل من دقيقة، MP4). بيطلع زر ▶ على صورة الخريج.' },
        },
        {
          name: 'videoDuration',
          label: 'مدة الفيديو',
          type: 'text',
          admin: { description: 'مثال: 1:12' },
        },
      ],
    },
    slugField('graduateName'),
    orderField,
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
