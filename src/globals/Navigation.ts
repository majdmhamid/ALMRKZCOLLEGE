import type { Field, GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'
import { linkField } from '@/fields/link'
import { enforceContentRulesGlobal } from '@/hooks/enforceContentRules'

const menuItemFields: Field[] = [
  { name: 'label', label: 'النص', type: 'text', localized: true, required: true },
  linkField(),
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'القائمة والتذييل',
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    group: 'إعدادات',
    description: 'قائمة أعلى الموقع، وأسفل الموقع (التذييل). اسحب العناصر لتغيير ترتيبها.',
  },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'القائمة العلوية',
          name: 'header',
          fields: [
            {
              name: 'items',
              label: 'عناصر القائمة',
              type: 'array',
              labels: { singular: 'عنصر', plural: 'عناصر' },
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/admin/RowLabel#LabelRowLabel' },
              },
              fields: [
                ...menuItemFields,
                {
                  name: 'children',
                  label: 'قائمة فرعية (اختياري)',
                  type: 'array',
                  labels: { singular: 'عنصر فرعي', plural: 'عناصر فرعية' },
                  admin: {
                    initCollapsed: true,
                    components: { RowLabel: '@/admin/RowLabel#LabelRowLabel' },
                  },
                  fields: menuItemFields,
                },
              ],
            },
            {
              name: 'cta',
              label: 'الزر البارز في القائمة',
              type: 'group',
              fields: [
                { name: 'show', label: 'إظهار الزر', type: 'checkbox', defaultValue: true },
                { name: 'label', label: 'نص الزر', type: 'text', localized: true },
                linkField(),
              ],
            },
          ],
        },
        {
          label: 'التذييل (أسفل الموقع)',
          name: 'footer',
          fields: [
            { name: 'about', label: 'نبذة قصيرة', type: 'textarea', localized: true },
            {
              name: 'columns',
              label: 'أعمدة الروابط',
              type: 'array',
              labels: { singular: 'عمود', plural: 'أعمدة' },
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/admin/RowLabel#TitleRowLabel' },
              },
              fields: [
                {
                  name: 'title',
                  label: 'عنوان العمود',
                  type: 'text',
                  localized: true,
                  required: true,
                },
                {
                  name: 'links',
                  label: 'الروابط',
                  type: 'array',
                  labels: { singular: 'رابط', plural: 'روابط' },
                  admin: {
                    initCollapsed: true,
                    components: { RowLabel: '@/admin/RowLabel#LabelRowLabel' },
                  },
                  fields: menuItemFields,
                },
              ],
            },
            {
              name: 'contactTitle',
              label: 'عنوان عمود «اتصل بنا»',
              type: 'text',
              localized: true,
              admin: { description: 'العنوان والهواتف والإيميل تُؤخذ من «إعدادات الموقع».' },
            },
            {
              name: 'copyright',
              label: 'سطر الحقوق',
              type: 'text',
              localized: true,
              admin: {
                description:
                  '{year} تُستبدل بالسنة الحالية تلقائياً. مثال: «© {year} كلية المركز. جميع الحقوق محفوظة.»',
              },
            },
            {
              name: 'bottomLinks',
              label: 'روابط صغيرة أسفل الصفحة (اختياري)',
              type: 'array',
              labels: { singular: 'رابط', plural: 'روابط' },
              admin: {
                description: 'مثل: سياسة الخصوصية، إمكانية الوصول (נגישות).',
                components: { RowLabel: '@/admin/RowLabel#LabelRowLabel' },
              },
              fields: menuItemFields,
            },
          ],
        },
      ],
    },
  ],
  hooks: { beforeValidate: [enforceContentRulesGlobal] },
}
