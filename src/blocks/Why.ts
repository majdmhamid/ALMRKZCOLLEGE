import type { Block } from 'payload'

import {
  imageField,
  kickerField,
  localizedText,
  sectionSettings,
  titleField,
  titleTextItems,
} from './shared'

/** «ليش كلية المركز؟» — numbered steps + photo with badges. */
export const WhyBlock: Block = {
  slug: 'why',
  interfaceName: 'WhyBlock',
  labels: { singular: 'ليش كلية المركز؟', plural: 'ليش كلية المركز؟' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    titleTextItems('items', 'النقاط', 'نقطة'),
    imageField('image', 'الصورة'),
    {
      name: 'pills',
      label: 'شارات فوق الصورة',
      type: 'array',
      labels: { singular: 'شارة', plural: 'شارات' },
      maxRows: 5,
      fields: [{ name: 'text', label: 'النص', type: 'text', localized: true, required: true }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'badgeNumber',
          label: 'الرقم في البطاقة العائمة',
          type: 'text',
          admin: { width: '40%', description: 'مثال: 2008' },
        },
        localizedText('badgeText', 'النص تحت الرقم', undefined, '60%'),
      ],
    },
    sectionSettings('why'),
  ],
}
