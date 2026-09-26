import type { Block } from 'payload'

import { kickerField, localizedText, sectionSettings, subtitleField, titleField } from './shared'

/** «قصص نجاح» — rotating graduate stories. */
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
      name: 'stories',
      label: 'القصص المعروضة',
      type: 'relationship',
      relationTo: 'success-stories',
      hasMany: true,
      admin: {
        description:
          'اتركه فارغاً لعرض القصص المعلَّمة «تظهر في الصفحة الرئيسية». تظهر فقط القصص التي فيها اقتباس.',
      },
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
