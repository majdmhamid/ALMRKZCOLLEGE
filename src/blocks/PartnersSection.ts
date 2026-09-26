import type { Block } from 'payload'

import { sectionSettings, titleField } from './shared'

/** «بالتعاون مع» — moving strip of partner logos. */
export const PartnersBlock: Block = {
  slug: 'partners',
  interfaceName: 'PartnersBlock',
  labels: { singular: 'شركاء (لوغوهات)', plural: 'شركاء' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    titleField,
    {
      name: 'partners',
      label: 'الشركاء المعروضون',
      type: 'relationship',
      relationTo: 'partners',
      hasMany: true,
      admin: { description: 'اتركه فارغاً لعرض كل الشركاء حسب الترتيب.' },
    },
    sectionSettings('partners'),
  ],
}
