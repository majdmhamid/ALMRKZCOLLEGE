import type { Block } from 'payload'

import { VOUCHER_TEXT } from '@/lib/rules'

import {
  kickerField,
  localizedText,
  localizedTextarea,
  sectionSettings,
  titleField,
} from './shared'

/** «جاهز تبدأ؟» — «سجّل اهتمامك» form + WhatsApp. Form labels are in «النصوص الثابتة». */
export const RegisterBlock: Block = {
  slug: 'register',
  interfaceName: 'RegisterBlock',
  labels: { singular: 'استمارة «سجّل اهتمامك»', plural: 'استمارة التسجيل' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    localizedTextarea('text', 'النص'),
    {
      name: 'showVoucherNote',
      label: 'إظهار سطر المنحة',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: `نص ثابت لا يُعدَّل: «${VOUCHER_TEXT.ar}»` },
    },
    {
      name: 'bullets',
      label: 'نقاط إضافية (مع علامة ✓)',
      type: 'array',
      labels: { singular: 'نقطة', plural: 'نقاط' },
      maxRows: 6,
      fields: [{ name: 'text', label: 'النص', type: 'text', localized: true, required: true }],
    },
    localizedText(
      'whatsappButton',
      'نص زر الواتساب',
      'رقم الواتساب يُضاف تلقائياً من «إعدادات الموقع».',
    ),
    sectionSettings('register'),
  ],
}
