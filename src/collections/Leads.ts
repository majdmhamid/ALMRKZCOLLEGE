import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { isAdmin, isAdminField } from '@/access'
import { serverURL } from '@/lib/preview'
import type { Lead } from '@/payload-types'

const STATUS_LABELS: Record<string, string> = {
  new: 'جديد',
  contacted: 'تمّ التواصل',
  closed: 'مغلق',
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

/** Emails the college about every new «سجّل اهتمامك» submission. */
const notifyCollege: CollectionAfterChangeHook<Lead> = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  try {
    const settings = await req.payload.findGlobal({ slug: 'site-settings', req, depth: 0 })
    const to = settings?.leadsNotificationEmails?.map((e) => e.email).filter(Boolean) ?? []
    if (!to.length && settings?.contact?.email) to.push(settings.contact.email)
    if (!to.length && process.env.LEADS_NOTIFY_EMAIL) to.push(process.env.LEADS_NOTIFY_EMAIL)
    if (!to.length) {
      req.payload.logger.warn(
        'New lead saved, but no notification email is configured in site settings.',
      )
      return doc
    }

    let courseName = doc.courseOther || ''
    if (doc.course) {
      const id = typeof doc.course === 'object' ? doc.course.id : doc.course
      const course = await req.payload
        .findByID({
          collection: 'courses',
          id,
          req,
          locale: 'ar',
          depth: 0,
          draft: false,
          overrideAccess: true,
        })
        .catch(() => null)
      if (course?.name) courseName = course.name
    }

    // serverURL(): NEXT_PUBLIC_SERVER_URL, or the Vercel address when it isn't set.
    const adminURL = `${serverURL()}/admin/collections/leads/${doc.id}`
    const rows: [string, string][] = [
      ['الاسم', doc.name],
      ['الهاتف', doc.phone],
      ['الدورة', courseName || '—'],
      ['الرسالة', doc.message || '—'],
      ['لغة الصفحة', doc.locale === 'he' ? 'عبري' : 'عربي'],
      ['من صفحة', doc.sourcePage || '—'],
    ]
    const cell = (k: string, v: string) =>
      k === 'الهاتف'
        ? `<a href="tel:${escapeHtml(v.replace(/[^\d+]/g, ''))}" dir="ltr">${escapeHtml(v)}</a>`
        : escapeHtml(v)
    await req.payload.sendEmail({
      to,
      subject: `طلب جديد من الموقع: ${doc.name}${courseName ? ` — ${courseName}` : ''}`,
      html: `<div dir="rtl" lang="ar" style="font-family:Arial,sans-serif;font-size:15px;text-align:right">
<h2>طلب اهتمام جديد من الموقع</h2>
<table dir="rtl" cellpadding="6" style="border-collapse:collapse">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="vertical-align:top"><b>${k}</b></td><td>${cell(k, String(v))}</td></tr>`,
        )
        .join('')}</table>
<p><a href="${adminURL}">فتح الطلب في لوحة التحكم</a></p></div>`,
      // Plain-text copy: phone notifications and some mail apps show only this part.
      text: [
        'طلب اهتمام جديد من الموقع',
        '',
        ...rows.map(([k, v]) => `${k}: ${v}`),
        '',
        `فتح الطلب في لوحة التحكم: ${adminURL}`,
      ].join('\n'),
    })
  } catch (err) {
    // Never lose a lead because the email failed — it is saved in the list anyway.
    req.payload.logger.error({ err, msg: 'Failed to send new-lead email' })
  }
  return doc
}

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'طلب تسجيل', plural: 'طلبات «سجّل اهتمامك»' },
  admin: {
    // تبويب «API» تقني — مش لمجد وحسين
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'course', 'status', 'createdAt'],
    group: 'الطلبات',
    listSearchableFields: ['name', 'phone', 'message'],
    components: {
      // «تنزيل كملف Excel» فوق الجدول، و«اتصل / واتساب» جنب زر الحفظ
      beforeListTable: ['@/admin/leads/ExportLeads#ExportLeads'],
      edit: { beforeDocumentControls: ['@/admin/leads/LeadContact#LeadContact'] },
    },
    description:
      'كل من عبّأ استمارة «سجّل اهتمامك» في الموقع. بعد التواصل مع الشخص غيّر الحالة إلى «تمّ التواصل». يصل إيميل للكلية مع كل طلب جديد.',
  },
  defaultSort: '-createdAt',
  access: {
    // Only admins can see, add or change leads. The website form («سجّل اهتمامك») saves through
    // its server action (src/components/site/actions.ts), which runs the spam checks (too fast,
    // rate limit, hidden trap field) first. A public REST create here would skip all of them and
    // let a bot fill the list (and the college's inbox) by posting straight to /api/leads.
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', label: 'الاسم', type: 'text', required: true, maxLength: 120 },
    {
      name: 'phone',
      label: 'الهاتف',
      type: 'text',
      required: true,
      maxLength: 30,
      validate: (value: string | null | undefined) => {
        const digits = (value || '').replace(/\D/g, '')
        return digits.length >= 9 && digits.length <= 15 ? true : 'رقم الهاتف غير صحيح.'
      },
    },
    {
      name: 'course',
      label: 'الدورة المطلوبة',
      type: 'relationship',
      relationTo: 'courses',
      // No «+ new course» / edit buttons inside a lead
      admin: { allowCreate: false, allowEdit: false },
    },
    {
      name: 'courseOther',
      label: 'دورة أخرى / غير متأكد',
      type: 'text',
      maxLength: 200,
    },
    { name: 'message', label: 'الرسالة', type: 'textarea', maxLength: 2000 },
    {
      name: 'status',
      label: 'الحالة',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
      access: { create: isAdminField, update: isAdminField },
      admin: {
        position: 'sidebar',
        description:
          'بعد ما تحكي مع الشخص غيّرها لـ«تمّ التواصل» واضغط «حفظ». الرقم الأحمر بالقائمة بيعدّ الطلبات «الجديدة» بس.',
      },
    },
    {
      name: 'internalNotes',
      label: 'ملاحظات داخلية',
      type: 'textarea',
      access: { create: isAdminField, read: isAdminField, update: isAdminField },
      admin: { position: 'sidebar', description: 'لا يراها أحد خارج الكلية.' },
    },
    {
      name: 'locale',
      label: 'لغة الصفحة',
      type: 'select',
      defaultValue: 'ar',
      options: [
        { label: 'عربي', value: 'ar' },
        { label: 'عبري', value: 'he' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'sourcePage',
      label: 'من أي صفحة',
      type: 'text',
      maxLength: 300,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      // Spam trap: hidden on the website form. Real people leave it empty.
      name: 'website',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeValidate: [
          ({ value, operation, req }) => {
            if (operation === 'create' && !req.user && value) throw new APIError('Rejected', 400)
            return undefined
          },
        ],
      },
    },
  ],
  hooks: { afterChange: [notifyCollege] },
  timestamps: true,
}
