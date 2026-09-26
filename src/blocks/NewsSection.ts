import type { Block } from 'payload'

import { kickerField, sectionSettings, titleField } from './shared'

/** «آخر الأخبار» — latest published news. */
export const NewsBlock: Block = {
  slug: 'news',
  interfaceName: 'NewsBlock',
  labels: { singular: 'آخر الأخبار', plural: 'آخر الأخبار' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    {
      name: 'count',
      label: 'عدد الأخبار المعروضة',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: { description: 'تظهر آخر الأخبار المنشورة تلقائياً (المثبّتة أولاً).' },
    },
    sectionSettings('news'),
  ],
}
