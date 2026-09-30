import type { Block } from 'payload'

import { kickerField, localizedText, sectionSettings, subtitleField, titleField } from './shared'

/** «قصص نجاح» — rotating graduate stories (the ones marked «اعرضها بالرئيسية», by order). */
export const SuccessStoriesBlock: Block = {
  slug: 'successStories',
  interfaceName: 'SuccessStoriesBlock',
  labels: { singular: 'قصص نجاح', plural: 'قصص نجاح' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    subtitleField,
    localizedText('videoLabel', 'النص فوق اسم الخريج في الصورة', 'مثال: «فيديو قصة النجاح».'),
    {
      // «مين بيطلع هون؟» — بدون عمود بالقاعدة (خانة عرض بس)
      name: 'storiesNotice',
      type: 'ui',
      admin: { components: { Field: '@/admin/StoriesPickNotice#StoriesPickNotice' } },
    },
    {
      // قديم: كان الاختيار اليدوي هون. من 2026-09-30 القصص بتنختار بزر «اعرضها بالرئيسية» على
      // بطاقة القصة (lib/home-stories.ts). الخانة مخفية ومش مستعملة — ما انمسحت عشان ما نحتاج
      // migration بتمسح بيانات. الاختيار القديم انتقل لـ«اعرضها بالرئيسية» (seed/run.ts ← moveHomeStories).
      name: 'stories',
      label: 'القصص المعروضة (قديم — مش مستعمل)',
      type: 'relationship',
      relationTo: 'success-stories',
      hasMany: true,
      admin: { hidden: true, disableListColumn: true, disableListFilter: true, disableBulkEdit: true },
    },
    {
      name: 'rotateSeconds',
      label: 'كل كم ثانية تتبدّل القصة',
      type: 'number',
      defaultValue: 6.5,
      min: 3,
      max: 30,
    },
    sectionSettings('graduates'),
  ],
}
