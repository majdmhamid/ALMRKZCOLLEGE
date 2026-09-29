import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
} from 'payload'
import { APIError } from 'payload'

import { adminOrSelf, isAdmin, isAdminField, isAdminUser } from '@/access'
import { serverURL } from '@/lib/preview'

/**
 * «نسيت كلمة السر» بدون إيميل مركّب (SMTP_HOST فاضي) على الموقع الحقيقي: Payload كان بيقول
 * «تفقّد بريدك» وما بيبعت إشي. هون بنوقّف الطلب برسالة واضحة. محلياً (npm run dev) الرابط
 * بينطبع بسجل السيرفر، فبنخليه يشتغل.
 */
export const emailIsSetUp = () => Boolean(process.env.SMTP_HOST) || process.env.NODE_ENV !== 'production'

export const NO_EMAIL_MESSAGE = {
  ar: 'إرسال الإيميلات لسا مش مفعّل بالموقع، فما بنقدر نبعتلك رابط لتغيير كلمة السر. اطلب من مدير اللوحة يغيّرها إلك من «المستخدمون».',
  he: 'שליחת מיילים עדיין לא מופעלת באתר, ולכן אי אפשר לשלוח קישור לאיפוס הסיסמה. בקשו ממנהל הלוח לשנות אותה עבורכם ב«משתמשים».',
}

const blockResetWithoutEmail: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation === 'forgotPassword' && !emailIsSetUp()) {
    throw new APIError(req.i18n?.language === 'he' ? NO_EMAIL_MESSAGE.he : NO_EMAIL_MESSAGE.ar, 503, undefined, true)
  }
  return args
}

const lang = (req: { i18n?: { language?: string } }) => (req.i18n?.language === 'he' ? 'he' : 'ar')

const otherAdmins = async (req: Parameters<CollectionBeforeOperationHook>[0]['req'], id: number | string) => {
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { and: [{ roles: { in: ['admin'] } }, { id: { not_equals: id } }] },
    req,
    overrideAccess: true,
  })
  return totalDocs
}

/** بدون حساب «مدير» واحد على الأقل ما حدا بيقدر يزيد مستخدمين أو يشوف الطلبات. */
const keepAnAdmin: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (req.user && String(req.user.id) === String(id)) {
    throw new APIError(
      lang(req) === 'he'
        ? 'אי אפשר למחוק את החשבון שלך. מנהל אחר יכול למחוק אותו.'
        : 'ما بتقدر تمسح حسابك إنت. مدير ثاني بيقدر يمسحه.',
      400,
      undefined,
      true,
    )
  }
  const target = await req.payload
    .findByID({ collection: 'users', id, depth: 0, req, overrideAccess: true })
    .catch(() => null)
  if (target?.roles?.includes('admin') && (await otherAdmins(req, id)) === 0) {
    throw new APIError(
      lang(req) === 'he' ? 'זה המנהל האחרון — אי אפשר למחוק אותו.' : 'هاد آخر «مدير» باللوحة — ما بينفع ينمسح.',
      400,
      undefined,
      true,
    )
  }
}

const keepAdminRole: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || !originalDoc?.roles?.includes('admin') || !Array.isArray(data?.roles)) return data
  if (!data.roles.includes('admin') && (await otherAdmins(req, originalDoc.id)) === 0) {
    throw new APIError(
      lang(req) === 'he'
        ? 'זה המנהל האחרון — השאירו לו הרשאת «מנהל» (אחרת אף אחד לא יוכל לנהל משתמשים ופניות).'
        : 'هاد آخر «مدير» — خلّي عنده صلاحية «مدير» (غير هيك ما حدا بيقدر يدير المستخدمين والطلبات).',
      400,
      undefined,
      true,
    )
  }
  return data
}

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
    beforeOperation: [blockResetWithoutEmail],
    beforeDelete: [keepAnAdmin],
    beforeChange: [
      keepAdminRole,
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
