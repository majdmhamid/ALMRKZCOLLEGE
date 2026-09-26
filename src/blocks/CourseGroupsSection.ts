import type { Block } from 'payload'

import { kickerField, localizedText, sectionSettings, subtitleField, titleField } from './shared'

/** «مجالات التأهيل» — carousel of course groups. */
export const CourseGroupsBlock: Block = {
  slug: 'courseGroups',
  interfaceName: 'CourseGroupsBlock',
  labels: { singular: 'مجالات التأهيل', plural: 'مجالات التأهيل' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    subtitleField,
    localizedText('swipeHint', 'نص «اسحب لرؤية المزيد»'),
    {
      name: 'groups',
      label: 'المجموعات المعروضة',
      type: 'relationship',
      relationTo: 'course-groups',
      hasMany: true,
      admin: {
        description:
          'اتركه فارغاً لعرض كل المجموعات المنشورة حسب ترتيبها. أو اختر مجموعات معيّنة واسحبها لترتيبها.',
      },
    },
    sectionSettings('fields'),
  ],
}
