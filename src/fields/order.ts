import type { Field } from 'payload'

export const orderField: Field = {
  name: 'order',
  label: 'الترتيب',
  type: 'number',
  defaultValue: 0,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'الرقم الأصغر يظهر أولاً (1 قبل 2).',
  },
}
