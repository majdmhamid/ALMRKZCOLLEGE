import type { GlobalConfig } from 'payload'

import { anyone, isAdminField, isStaff } from '@/access'
import { enforceContentRulesGlobal } from '@/hooks/enforceContentRules'

const imageOnly = { mimeType: { contains: 'image' } }

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'إعدادات الموقع',
  admin: {
    group: 'إعدادات',
    description: 'اللوغو، معلومات الاتصال، السوشال ميديا، وإعدادات جوجل — تظهر في كل صفحات الموقع.',
  },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'الهوية واللوغو',
          fields: [
            {
              name: 'siteName',
              label: 'اسم الكلية',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'shortName',
              label: 'اسم مختصر',
              type: 'text',
              localized: true,
              admin: { description: 'مثال: «كلية المركز».' },
            },
            { name: 'tagline', label: 'شعار / جملة تعريف قصيرة', type: 'text', localized: true },
            {
              name: 'accreditation',
              label: 'جملة الاعتماد',
              type: 'text',
              localized: true,
              admin: { description: 'مثال: «بإشراف وزارة العمل منذ 2008».' },
            },
            { name: 'foundedYear', label: 'سنة التأسيس', type: 'number', defaultValue: 2008 },
            {
              type: 'row',
              fields: [
                {
                  name: 'logoLight',
                  label: 'اللوغو — للخلفية الفاتحة',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: imageOnly,
                  admin: {
                    description:
                      'النسخة الملوّنة/الغامقة التي تظهر على خلفية بيضاء. يُفضّل SVG أو PNG شفّاف.',
                  },
                },
                {
                  name: 'logoDark',
                  label: 'اللوغو — للخلفية الغامقة',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: imageOnly,
                  admin: {
                    description:
                      'النسخة البيضاء/الفاتحة التي تظهر فوق الفيديو أو الخلفيات الغامقة.',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'logoMark',
                  label: 'رمز اللوغو فقط (اختياري)',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: imageOnly,
                  admin: { description: 'الرمز بدون الكتابة — للموبايل والأماكن الضيّقة.' },
                },
                {
                  name: 'favicon',
                  label: 'أيقونة المتصفح (favicon)',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: imageOnly,
                  admin: {
                    description: 'الصورة الصغيرة في تبويب المتصفح. مربّعة، 512×512 بكسل، PNG.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'الاتصال',
          fields: [
            {
              name: 'contact',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'phones',
                  label: 'أرقام الهاتف',
                  type: 'array',
                  labels: { singular: 'رقم', plural: 'أرقام' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          label: 'الوصف',
                          type: 'text',
                          localized: true,
                          admin: { description: 'مثال: «المكتب»، «التسجيل».' },
                        },
                        {
                          name: 'number',
                          label: 'الرقم',
                          type: 'text',
                          required: true,
                          admin: { description: 'مثال: 04-6111111' },
                        },
                        {
                          name: 'showInHeader',
                          label: 'يظهر أعلى الموقع',
                          type: 'checkbox',
                          defaultValue: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'whatsapp',
                      label: 'رقم الواتساب',
                      type: 'text',
                      admin: {
                        description: 'بالصيغة الدولية بدون + وبدون صفر البداية. مثال: 972501234567',
                      },
                      validate: (v: string | null | undefined) =>
                        !v || /^\d{9,15}$/.test(v)
                          ? true
                          : 'اكتب الرقم أرقاماً فقط، مثل 972501234567',
                    },
                    {
                      name: 'whatsappMessage',
                      label: 'رسالة الواتساب الجاهزة',
                      type: 'text',
                      localized: true,
                      admin: { description: 'مثال: «مرحباً، بدي أستفسر عن الدورات».' },
                    },
                  ],
                },
                { name: 'email', label: 'البريد الإلكتروني', type: 'email' },
                { name: 'address', label: 'العنوان', type: 'textarea', localized: true },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'mapUrl',
                      label: 'رابط الخريطة (Google Maps / Waze)',
                      type: 'text',
                      admin: { description: 'الرابط الذي يفتح الخريطة عند الضغط.' },
                    },
                    {
                      name: 'mapEmbedUrl',
                      label: 'رابط تضمين الخريطة (اختياري)',
                      type: 'text',
                      admin: {
                        description:
                          'من Google Maps: مشاركة ← تضمين خريطة ← انسخ الرابط الذي داخل src="..." فقط.',
                      },
                    },
                  ],
                },
                {
                  name: 'openingHours',
                  label: 'ساعات الدوام',
                  type: 'array',
                  labels: { singular: 'سطر', plural: 'أسطر' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'days',
                          label: 'الأيام',
                          type: 'text',
                          localized: true,
                          required: true,
                          admin: { description: 'مثال: «الأحد – الخميس».' },
                        },
                        {
                          name: 'hours',
                          label: 'الساعات',
                          type: 'text',
                          localized: true,
                          required: true,
                          admin: { description: 'مثال: «08:00 – 16:00» أو «مغلق».' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'السوشال ميديا',
          fields: [
            {
              name: 'social',
              label: 'روابط السوشال ميديا',
              type: 'array',
              labels: { singular: 'رابط', plural: 'روابط' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      label: 'المنصّة',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'فيسبوك', value: 'facebook' },
                        { label: 'إنستغرام', value: 'instagram' },
                        { label: 'تيك توك', value: 'tiktok' },
                        { label: 'يوتيوب', value: 'youtube' },
                        { label: 'لينكدإن', value: 'linkedin' },
                        { label: 'X (تويتر)', value: 'x' },
                        { label: 'تلغرام', value: 'telegram' },
                        { label: 'أخرى', value: 'other' },
                      ],
                    },
                    { name: 'url', label: 'الرابط', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'جوجل والمشاركة',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: 'إعدادات جوجل الافتراضية',
              fields: [
                {
                  name: 'titleTemplate',
                  label: 'قالب عنوان الصفحات',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: '%s تُستبدل باسم الصفحة. مثال: «%s | كلية المركز للتأهيل المهني».',
                  },
                },
                {
                  name: 'defaultTitle',
                  label: 'عنوان الصفحة الرئيسية في جوجل',
                  type: 'text',
                  localized: true,
                  maxLength: 70,
                },
                {
                  name: 'defaultDescription',
                  label: 'وصف الموقع في جوجل',
                  type: 'textarea',
                  localized: true,
                  maxLength: 170,
                },
                {
                  name: 'ogImage',
                  label: 'صورة المشاركة الافتراضية',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: imageOnly,
                  admin: {
                    description: 'تظهر عند مشاركة رابط الموقع في واتساب وفيسبوك. 1200×630 بكسل.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'إشعارات الطلبات',
          fields: [
            {
              name: 'leadsNotificationEmails',
              label: 'إيميلات تستقبل الطلبات الجديدة',
              type: 'array',
              labels: { singular: 'إيميل', plural: 'إيميلات' },
              access: { read: isAdminField, update: isAdminField, create: isAdminField },
              admin: {
                description:
                  'كل طلب «سجّل اهتمامك» جديد يُرسَل لهذه العناوين. إذا تُركت فارغة يُرسَل للإيميل في تبويب «الاتصال».',
              },
              fields: [{ name: 'email', label: 'الإيميل', type: 'email', required: true }],
            },
          ],
        },
      ],
    },
  ],
  hooks: { beforeValidate: [enforceContentRulesGlobal] },
}
