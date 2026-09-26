import type { CollectionConfig } from 'payload'

import { anyone, isStaff } from '@/access'
import { orderField } from '@/fields/order'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'شريك', plural: 'الشركاء والجهات المعتمِدة' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order'],
    group: 'عن الكلية',
    description: 'الجهات المعتمِدة والشركات الشريكة — لوغوهاتها تظهر في شريط «بالتعاون مع».',
  },
  defaultSort: 'order',
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'name', label: 'الاسم', type: 'text', localized: true, required: true },
    {
      name: 'logo',
      label: 'اللوغو',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'PNG شفّاف أو SVG، مقصوص بدون فراغ حوله.' },
    },
    { name: 'url', label: 'موقعهم (اختياري)', type: 'text' },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { hidden: true } },
    orderField,
  ],
}
