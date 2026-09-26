import type { Block } from 'payload'

import { APPROVED_EMPLOYMENT_WORDING } from '@/lib/rules'

import { kickerField, localizedTextarea, sectionSettings, titleField } from './shared'

/** «أسئلة شائعة» — accordion. */
export const FaqBlock: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: 'أسئلة شائعة', plural: 'أسئلة شائعة' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    localizedTextarea('text', 'النص تحت العنوان'),
    {
      name: 'items',
      label: 'الأسئلة',
      type: 'array',
      labels: { singular: 'سؤال', plural: 'أسئلة' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '@/admin/RowLabel#QuestionRowLabel' },
        description: 'عند الحديث عن ما بعد التخرّج: ' + APPROVED_EMPLOYMENT_WORDING,
      },
      fields: [
        { name: 'question', label: 'السؤال', type: 'text', localized: true, required: true },
        { name: 'answer', label: 'الجواب', type: 'textarea', localized: true, required: true },
      ],
    },
    sectionSettings('faq'),
  ],
}
