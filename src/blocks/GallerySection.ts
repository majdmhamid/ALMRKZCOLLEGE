import type { Block } from 'payload'

import { kickerField, sectionSettings, subtitleField, titleField } from './shared'

/** «لمحة من ورشاتنا» — photos from the «معرض الصور والفيديو» page. */
export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'صور من الورشات', plural: 'صور من الورشات' },
  admin: { components: { Label: '@/admin/RowLabel#SectionRowLabel' } },
  fields: [
    kickerField,
    titleField,
    subtitleField,
    {
      name: 'count',
      label: 'عدد الصور المعروضة',
      type: 'number',
      defaultValue: 10,
      min: 3,
      max: 30,
      admin: { description: 'الصور تُؤخذ من صفحة «معرض الصور والفيديو» بنفس الترتيب.' },
    },
    sectionSettings('gallery'),
  ],
}
