import type { CollectionConfig } from 'payload'

import { adminOrSelf, isAdmin, isAdminField, isAdminUser } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'مستخدم', plural: 'المستخدمون' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'الإدارة',
    description:
      'من يستطيع الدخول للوحة التحكم. «مدير» يتحكم بكل شيء، «محرّر» يعدّل محتوى الموقع فقط (لا يرى الطلبات ولا المستخدمين). ' +
      'لتغيير كلمة السر تبعتك: اضغط على اسمك تحت بالقائمة الجانبية ← «تغيير كلمة المرور».',
  },
  auth: {
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  fields: [
    {
      name: 'name',
      label: 'الاسم',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      label: 'الصلاحية',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      saveToJWT: true,
      admin: {
        description:
          'اختار وحدة بس: «مدير» (كل إشي، مع الطلبات والحسابات) أو «محرّر» (نصوص وصور الموقع بس). إذا بدك تغيّرها، امسح القديمة بالـ ✕.',
      },
      options: [
        { label: 'مدير (كل شيء)', value: 'admin' },
        { label: 'محرّر (المحتوى فقط)', value: 'editor' },
      ],
      access: {
        // Only admins can give or remove permissions (editors can't promote themselves).
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
  hooks: {
    beforeChange: [
      // The very first account (created on the /admin welcome screen) is always an admin.
      async ({ data, operation, req }) => {
        if (operation !== 'create' || isAdminUser(req)) return data
        const { totalDocs } = await req.payload.count({
          collection: 'users',
          req,
          overrideAccess: true,
        })
        if (totalDocs === 0) return { ...data, roles: ['admin'] }
        return data
      },
    ],
  },
}
