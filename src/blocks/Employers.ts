import type { Block } from 'payload'

import {
  kickerField,
  localizedText,
  localizedTextarea,
  sectionSettings,
  titleField,
  titleTextItems,
} from './shared'

/** «للشركات والمشغّلين» — green B2B block. */
export const EmployersBlock: Block = {
  slug: 'employers',
  interfaceName: 'EmployersBlock',
  labels: { singular: 'للشركات والمشغّلين', plural: 'للشركات والمشغّلين' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    localizedTextarea('text', 'النص'),
    titleTextItems('items', 'الخدمات', 'خدمة'),
    {
      type: 'row',
      fields: [
        localizedText('whatsappButton', 'نص زر الواتساب', undefined, '50%'),
        localizedText('hiringButton', 'نص الزر الثاني', undefined, '50%'),
      ],
    },
    localizedTextarea(
      'hiringText',
      'نص «تبحث عن مهنيين؟»',
      'بدون وعود. مثال: «الكلية على تواصل دائم مع خريجيها. تواصل معنا ونوجّه إليك خريجين ملائمين.»',
    ),
    sectionSettings('employers'),
  ],
}
