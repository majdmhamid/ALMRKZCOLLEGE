import type { Block } from 'payload'

import { sectionSettings } from './shared'

/** Numbers strip under the hero («11+ دورة مهنية»). */
export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'أرقام', plural: 'أرقام' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    {
      name: 'items',
      label: 'الأرقام',
      type: 'array',
      labels: { singular: 'رقم', plural: 'أرقام' },
      minRows: 1,
      maxRows: 6,
      admin: { components: { RowLabel: '@/admin/RowLabel#LabelRowLabel' } },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              label: 'الرقم',
              type: 'number',
              required: true,
              admin: { width: '25%' },
            },
            {
              name: 'suffix',
              label: 'بعد الرقم',
              type: 'text',
              defaultValue: '+',
              admin: { width: '15%' },
            },
            {
              name: 'label',
              label: 'الوصف',
              type: 'text',
              localized: true,
              required: true,
              admin: { width: '35%' },
            },
            {
              name: 'anchor',
              label: 'يأخذ إلى قسم',
              type: 'text',
              admin: { width: '25%', description: 'مثال: courses' },
            },
          ],
        },
      ],
    },
    sectionSettings('stats'),
  ],
}
