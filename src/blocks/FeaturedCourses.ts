import type { Block } from 'payload'

import { kickerField, localizedText, sectionSettings, titleField } from './shared'

/** «أبرز الدورات» — course cards carousel. */
export const FeaturedCoursesBlock: Block = {
  slug: 'featuredCourses',
  interfaceName: 'FeaturedCoursesBlock',
  labels: { singular: 'أبرز الدورات', plural: 'أبرز الدورات' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    localizedText('allCoursesButton', 'نص زر «كل الدورات»'),
    {
      name: 'courses',
      label: 'الدورات المعروضة',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      admin: {
        description:
          'اتركه فارغاً لعرض الدورات المعلَّمة «دورة مميّزة» تلقائياً. أو اختر دورات معيّنة واسحبها لترتيبها.',
      },
    },
    sectionSettings('courses'),
  ],
}
