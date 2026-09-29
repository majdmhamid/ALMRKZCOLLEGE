import type { CollectionConfig } from 'payload'

import { adminOrSelf, isAdmin, isAdminField, isAdminUser } from '@/access'
import { serverURL } from '@/lib/preview'

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
    // The login cookie is only ever sent over HTTPS on the real site (Payload's default is not).
    // A computer running the site on http://localhost keeps working.
    cookies: { secure: serverURL().startsWith('https://'), sameSite: 'Lax' },
    // «نسيت كلمة السر»: Payload's own email has no right-to-left direction (Gmail shows the
    // Arabic aligned left). Same content, RTL, with the site's address.
    forgotPassword: {
      generateEmailSubject: () => 'تغيير كلمة السر — لوحة تحكم كلية المركز',
      generateEmailHTML: (args) => {
        const url = `${serverURL()}/admin/reset/${args?.token ?? ''}`
        return `<div dir="rtl" lang="ar" style="font-family:Arial,sans-serif;font-size:15px;text-align:right">
<p>وصلنا طلب لتغيير كلمة السر لحسابك بلوحة تحكم موقع كلية المركز.</p>
<p><a href="${url}">اضغط هون لاختيار كلمة سر جديدة</a> (الرابط صالح لساعة وحدة).</p>
<p dir="ltr" style="text-align:left;font-size:12px;color:#555">${url}</p>
<p>إذا ما طلبت هاد الإشي، تجاهل الإيميل — كلمة السر ما بتتغيّر.</p></div>`
      },
    },
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
