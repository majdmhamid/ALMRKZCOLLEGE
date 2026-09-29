'use client'

import { toast, useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import { FileDown, MessageCircle, Phone } from 'lucide-react'
import React, { useState } from 'react'

import { adminLang, shellText } from '../i18n'
import { toTel, toWhatsApp } from './format'

type LeadDoc = {
  name?: string
  phone?: string
  course?: { name?: string } | number | null
  courseOther?: string | null
  message?: string | null
  marketingConsent?: boolean | null
  status?: string
  locale?: string | null
  sourcePage?: string | null
  createdAt?: string
}

/** The copy is written in the language the person used on the website. */
const COPY = {
  ar: {
    title: 'كلية المركز للتأهيل المهني — نسخة من المعلومات المحفوظة عنك (طلب «سجّل اهتمامك»)',
    issued: 'تاريخ إصدار النسخة',
    when: 'تاريخ الطلب',
    name: 'الاسم',
    phone: 'الهاتف',
    course: 'الدورة',
    message: 'الرسالة',
    marketing: 'موافقة على رسائل تسويقية',
    status: 'حالة الطلب عند الكلية',
    lang: 'لغة الصفحة',
    source: 'أُرسل من الصفحة',
    yes: 'نعم',
    no: 'لا',
    footer:
      'هذه كل المعلومات الشخصية المحفوظة عنك في موقع الكلية بخصوص هذا الطلب. يمكنك طلب تصحيحها أو حذفها في أي وقت.',
    file: 'معلوماتي',
  },
  he: {
    title: 'מכללת המרכז להכשרה מקצועית — עותק מהמידע השמור עליך (פנייה «השאירו פרטים»)',
    issued: 'תאריך הפקת העותק',
    when: 'תאריך הפנייה',
    name: 'שם',
    phone: 'טלפון',
    course: 'קורס',
    message: 'הודעה',
    marketing: 'הסכמה להודעות שיווקיות',
    status: 'סטטוס הפנייה במכללה',
    lang: 'שפת הדף',
    source: 'נשלח מהדף',
    yes: 'כן',
    no: 'לא',
    footer: 'זהו כל המידע האישי השמור עליך באתר המכללה בנוגע לפנייה זו. ניתן לבקש לתקן או למחוק אותו בכל עת.',
    file: 'המידע-שלי',
  },
}

/**
 * «نسخة للشخص»: a plain text file with everything the college holds about this request — for
 * when someone asks «what do you have about me?» (right of access, section 13 of the privacy
 * law). Internal notes are left out on purpose: they are the college's, not the person's.
 */
async function downloadCopy(id: string | number, lang: 'ar' | 'he') {
  const res = await fetch(`/api/leads/${id}?depth=1&locale=${lang}`, { credentials: 'include' })
  if (!res.ok) throw new Error(String(res.status))
  const d = (await res.json()) as LeadDoc
  const locale = d.locale === 'he' ? 'he' : 'ar'
  const c = COPY[locale]
  const t = shellText(locale).leads
  const when = d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : ''
  const lines = [
    c.title,
    `${c.issued}: ${new Date().toLocaleString('en-GB')}`,
    '',
    `${c.when}: ${when}`,
    `${c.name}: ${d.name ?? ''}`,
    `${c.phone}: ${d.phone ?? ''}`,
    `${c.course}: ${typeof d.course === 'object' && d.course ? (d.course.name ?? '') : (d.courseOther ?? '')}`,
    `${c.message}: ${d.message ?? ''}`,
    `${c.marketing}: ${d.marketingConsent ? c.yes : c.no}`,
    `${c.status}: ${t.status[d.status ?? ''] ?? d.status ?? ''}`,
    `${c.lang}: ${t.langs[d.locale ?? 'ar'] ?? d.locale ?? ''}`,
    `${c.source}: ${d.sourcePage ?? ''}`,
    '',
    c.footer,
  ]
  const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${c.file}-${String(d.name ?? id).replace(/[\/:*?"<>|]/g, '')}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** «اتصل»، «واتساب» و«نسخة للشخص» جنب زر الحفظ بصفحة الطلب — بدون نسخ الرقم. */
export const LeadContact: React.FC = () => {
  const phone = useFormFields(([fields]) => fields.phone?.value) as string | undefined
  const { id } = useDocumentInfo()
  const { i18n } = useTranslation()
  const lang = adminLang(i18n)
  const t = shellText(lang).leads
  const [busy, setBusy] = useState(false)
  if (!phone || phone.replace(/\D/g, '').length < 9) return null
  const style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }
  const copy = async () => {
    if (!id) return
    setBusy(true)
    try {
      await downloadCopy(id, lang)
    } catch {
      toast.error(t.copyFailed)
    } finally {
      setBusy(false)
    }
  }
  return (
    <span style={{ display: 'inline-flex', gap: 8, marginInlineEnd: 8 }}>
      <a className="btn btn--style-secondary btn--size-small" style={style} href={`tel:${toTel(phone)}`}>
        <Phone size={14} /> {t.call}
      </a>
      <a
        className="btn btn--style-secondary btn--size-small"
        style={style}
        href={`https://wa.me/${toWhatsApp(phone)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={14} /> {t.whatsapp}
      </a>
      {id && (
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          style={style}
          onClick={copy}
          disabled={busy}
          title={t.copyTitle}
        >
          <FileDown size={14} /> {t.copy}
        </button>
      )}
    </span>
  )
}
