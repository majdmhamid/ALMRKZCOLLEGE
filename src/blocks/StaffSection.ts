import type { Block } from 'payload'

import { kickerField, sectionSettings, subtitleField, titleField } from './shared'

/** «طاقم الكلية» — moving strip of staff profiles. */
export const StaffBlock: Block = {
  slug: 'staff',
  interfaceName: 'StaffBlock',
  labels: { singular: 'طاقم الكلية', plural: 'طاقم الكلية' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    subtitleField,
    {
      name: 'members',
      label: 'أعضاء الطاقم المعروضون',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
      admin: { description: 'اتركه فارغاً لعرض كل الطاقم حسب الترتيب.' },
    },
    sectionSettings('staff'),
  ],
}
