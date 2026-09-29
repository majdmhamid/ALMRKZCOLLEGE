import type { CollectionConfig } from 'payload'

import { anyone, isStaff } from '@/access'
import { orderField } from '@/fields/order'
import { duplicateSlug } from '@/fields/slug'
import { enforceContentRules } from '@/hooks/enforceContentRules'

export const Staff: CollectionConfig = {
  slug: 'staff',
  labels: { singular: 'عضو طاقم', plural: 'طاقم الكلية' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order'],
    group: 'عن الكلية',
  },
  defaultSort: 'order',
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'name', label: 'الاسم', type: 'text', localized: true, required: true },
    {
      name: 'role',
      label: 'الوظيفة',
      type: 'text',
      localized: true,
      required: true,
      admin: { description: 'مثال: «مركّز دورات اللحام».' },
    },
    {
      name: 'bio',
      label: 'نبذة',
      type: 'textarea',
      localized: true,
      admin: { description: '3–4 جمل. تظهر مختصرة مع زر «اقرأ المزيد».' },
    },
    {
      name: 'photo',
      label: 'الصورة',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: { description: 'صورة طولية (4:5)، الوجه واضح.' },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { hidden: true },
      hooks: { beforeDuplicate: [duplicateSlug] },
    },
    orderField,
  ],
  hooks: { beforeValidate: [enforceContentRules] },
}
