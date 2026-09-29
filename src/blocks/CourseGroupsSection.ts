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
      label: 'المجالات المعروضة',
      type: 'relationship',
      relationTo: 'course-groups',
      hasMany: true,
      admin: {
        description:
          'اتركه فارغاً لعرض كل المجالات الظاهرة بالموقع حسب ترتيبها (وأي مجال جديد بينضاف لحاله). ' +
          'أو اختر مجالات معيّنة واسحبها لترتيبها — بهاي الحالة مجال جديد ما بيطلع هون إلا إذا أضفته.',
      },
    },
    {
      // «في مجال جديد، بدك تضيفه؟» — بدون عمود بالقاعدة (خانة عرض بس)
      name: 'groupsNotice',
      type: 'ui',
      admin: { components: { Field: '@/admin/GroupsPickNotice#GroupsPickNotice' } },
    },
    sectionSettings('fields'),
  ],
}
