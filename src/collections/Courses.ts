import type { CollectionConfig } from 'payload'

import { isStaff, publishedOrStaff } from '@/access'
import { orderField } from '@/fields/order'
import { seoField } from '@/fields/seo'
import { slugField } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'
import { previewPath } from '@/lib/preview'
import { APPROVED_EMPLOYMENT_WORDING, VOUCHER_TEXT } from '@/lib/rules'
import { validateYoutubeUrl } from '@/lib/youtube'

/**
 * A course (PLAN.md §4). There is deliberately NO price field — prices are never
 * shown on the website.
 */
export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'دورة', plural: 'الدورات' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'group', 'voucherEligible', 'order', '_status'],
    group: 'الدورات',
    listSearchableFields: ['name', 'shortDescription'],
    description: 'كل دورات الكلية. لا يوجد حقل سعر — الأسعار لا تظهر على الموقع أبداً.',
    preview: (doc, { locale }) =>
      previewPath({ collection: 'courses', slug: doc?.slug as string, locale }),
  },
  defaultSort: 'order',
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 30 },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'الأساسي',
          fields: [
            {
              name: 'name',
              label: 'اسم الدورة',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'group',
              label: 'المجال',
              type: 'relationship',
              relationTo: 'course-groups',
              required: true,
              index: true,
            },
            {
              name: 'shortDescription',
              label: 'وصف مختصر (للبطاقة)',
              type: 'textarea',
              localized: true,
              required: true,
              maxLength: 220,
              admin: { description: 'سطرين تقريباً. يظهر على بطاقة الدورة في القوائم.' },
            },
            {
              name: 'fullDescription',
              label: 'وصف كامل',
              type: 'richText',
              localized: true,
            },
            {
              name: 'topics',
              label: 'مواضيع الدورة',
              type: 'array',
              labels: { singular: 'موضوع', plural: 'مواضيع' },
              admin: { description: 'ماذا يتعلّم الطالب — كل موضوع بسطر.' },
              fields: [
                { name: 'topic', label: 'الموضوع', type: 'text', localized: true, required: true },
              ],
            },
            {
              name: 'highlights',
              label: 'مميزات بارزة (اختياري)',
              type: 'array',
              labels: { singular: 'ميزة', plural: 'مميزات' },
              admin: {
                description: 'مثل: «تدريب عملي في ورشة مجهّزة». بدون أسعار وبدون وعود بالعمل.',
              },
              fields: [
                { name: 'text', label: 'النص', type: 'text', localized: true, required: true },
              ],
            },
          ],
        },
        {
          label: 'المدة والدوام',
          fields: [
            {
              name: 'duration',
              label: 'مدة الدورة (اختياري)',
              type: 'text',
              localized: true,
              admin: { description: 'مثال: «4 أشهر» / «4 חודשים».' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'hours',
                  label: 'عدد الساعات',
                  type: 'number',
                  min: 0,
                  admin: { width: '50%', description: 'مجموع ساعات الدورة (رقم فقط).' },
                },
                {
                  name: 'sessions',
                  label: 'عدد اللقاءات',
                  type: 'number',
                  min: 0,
                  admin: { width: '50%', description: 'كم مرة يأتي الطالب (رقم فقط).' },
                },
              ],
            },
            {
              name: 'schedule',
              label: 'نوع الدوام',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'صباحي', value: 'morning' },
                { label: 'مسائي', value: 'evening' },
                { label: 'نهاية الأسبوع', value: 'weekend' },
                { label: 'عن بُعد', value: 'online' },
              ],
            },
            {
              name: 'scheduleDetails',
              label: 'تفاصيل مواعيد الدوام',
              type: 'text',
              localized: true,
              admin: { description: 'مثال: «مرتين بالأسبوع، الأحد والثلاثاء 17:00–21:00».' },
            },
            {
              name: 'nextStart',
              label: 'موعد البدء القريب',
              type: 'date',
              admin: {
                date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
                description: 'اختياري. اتركه فارغاً إذا لم يُحدَّد بعد.',
              },
            },
            {
              name: 'nextStartNote',
              label: 'ملاحظة عن موعد البدء',
              type: 'text',
              localized: true,
              admin: {
                description:
                  'بدل التاريخ أو معه، مثل: «التسجيل مفتوح — تبدأ الدورة عند اكتمال المجموعة».',
              },
            },
          ],
        },
        {
          label: 'الشهادة والقبول',
          fields: [
            {
              name: 'certificate',
              label: 'الشهادة',
              type: 'text',
              localized: true,
              required: true,
              admin: { description: 'اسم الشهادة التي يحصل عليها الخريج.' },
            },
            {
              name: 'certifyingBody',
              label: 'الجهة المعتمِدة',
              type: 'text',
              localized: true,
              required: true,
              admin: { description: 'مثال: «وزارة العمل» / «משרד העבודה».' },
            },
            {
              name: 'certificateValue',
              label: 'شو بتفيد الشهادة بسوق العمل',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'بدون وعود بالعمل. مثال: «تؤهّل للعمل كمساعد سلامة في مواقع البناء».',
              },
            },
            {
              name: 'admission',
              label: 'شروط القبول',
              type: 'group',
              fields: [
                {
                  name: 'age',
                  label: 'العمر',
                  type: 'text',
                  localized: true,
                  admin: { description: 'مثال: «من جيل 18 وما فوق».' },
                },
                {
                  name: 'education',
                  label: 'التعليم',
                  type: 'text',
                  localized: true,
                  admin: { description: 'مثال: «10 سنوات تعليم».' },
                },
                {
                  name: 'hebrew',
                  label: 'اللغة العبرية',
                  type: 'text',
                  localized: true,
                  admin: { description: 'مثال: «قراءة وكتابة أساسية».' },
                },
                { name: 'experience', label: 'خبرة سابقة', type: 'text', localized: true },
                {
                  name: 'other',
                  label: 'شروط أخرى',
                  type: 'array',
                  labels: { singular: 'شرط', plural: 'شروط' },
                  fields: [
                    { name: 'text', label: 'الشرط', type: 'text', localized: true, required: true },
                  ],
                },
              ],
            },
            {
              name: 'voucherEligible',
              label: 'ملائمة للحصول على منحة (שובר)',
              type: 'checkbox',
              defaultValue: false,
              index: true,
              admin: {
                description: `عند التفعيل يظهر على الموقع النص الثابت: «${VOUCHER_TEXT.ar}» — هذا النص لا يُعدَّل.`,
              },
            },
            {
              name: 'careerGuidance',
              label: 'مرافقة وتوجيه مهني بعد التخرّج (اختياري)',
              type: 'textarea',
              localized: true,
              admin: {
                description: `${APPROVED_EMPLOYMENT_WORDING}`,
              },
            },
          ],
        },
        {
          label: 'الصور والفيديو',
          fields: [
            {
              name: 'coverImage',
              label: 'الصورة الرئيسية',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
              admin: {
                description: 'تظهر على بطاقة الدورة وأعلى صفحتها. يُفضّل صورة حقيقية من الورشة.',
              },
            },
            {
              name: 'gallery',
              label: 'صور إضافية',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              filterOptions: { mimeType: { contains: 'image' } },
            },
            {
              name: 'video',
              label: 'فيديو (اختياري)',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'video' } },
              admin: { description: 'فيديو قصير ومضغوط (أقل من دقيقة، MP4).' },
            },
            {
              name: 'videoPoster',
              label: 'صورة غلاف الفيديو',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { contains: 'image' } },
              admin: {
                condition: (data) => Boolean(data?.video),
                description: 'تظهر قبل تشغيل الفيديو.',
              },
            },
            {
              name: 'youtubeUrl',
              label: 'أو رابط يوتيوب (اختياري)',
              type: 'text',
              validate: validateYoutubeUrl,
              admin: { description: 'بدل رفع الفيديو، يمكن وضع رابط فيديو من يوتيوب.' },
            },
          ],
        },
        {
          label: 'جوجل',
          fields: [seoField],
        },
      ],
    },
    {
      name: 'featured',
      label: 'دورة مميّزة (تظهر في الصفحة الرئيسية)',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
    },
    slugField('name'),
    orderField,
    {
      name: 'rulesNote',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/admin/RulesNote#RulesNote' },
      },
    },
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
