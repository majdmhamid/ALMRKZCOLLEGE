'use client'

import { toast, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { FileDown, MessageCircle, Phone } from 'lucide-react'
import React, { useState } from 'react'

/** 050-1234567 → 972501234567 (for wa.me). Numbers already in international form stay. */
export function toWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('972')) return digits
  if (digits.startsWith('0')) return `972${digits.slice(1)}`
  return digits
}

const STATUS: Record<string, string> = { new: 'جديد', contacted: 'تمّ التواصل', closed: 'مغلق' }

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

/**
 * «نسخة للشخص»: a plain text file with everything the college holds about this request — for
 * when someone asks «what do you have about me?» (right of access, section 13 of the privacy
 * law). Internal notes are left out on purpose: they are the college's, not the person's.
 */
async function downloadCopy(id: string | number) {
  const res = await fetch(`/api/leads/${id}?depth=1&locale=ar`, { credentials: 'include' })
  if (!res.ok) throw new Error(String(res.status))
  const d = (await res.json()) as LeadDoc
  const when = d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : ''
  const lines = [
    'كلية المركز للتأهيل المهني — نسخة من المعلومات المحفوظة عنك (طلب «سجّل اهتمامك»)',
    `تاريخ إصدار النسخة: ${new Date().toLocaleString('en-GB')}`,
    '',
    `تاريخ الطلب: ${when}`,
    `الاسم: ${d.name ?? ''}`,
    `الهاتف: ${d.phone ?? ''}`,
    `الدورة: ${typeof d.course === 'object' && d.course ? (d.course.name ?? '') : (d.courseOther ?? '')}`,
    `الرسالة: ${d.message ?? ''}`,
    `موافقة على رسائل تسويقية: ${d.marketingConsent ? 'نعم' : 'لا'}`,
    `حالة الطلب عند الكلية: ${STATUS[d.status ?? ''] ?? d.status ?? ''}`,
    `لغة الصفحة: ${d.locale === 'he' ? 'عبري' : 'عربي'}`,
    `أُرسل من الصفحة: ${d.sourcePage ?? ''}`,
    '',
    'هذه كل المعلومات الشخصية المحفوظة عنك في موقع الكلية بخصوص هذا الطلب. يمكنك طلب تصحيحها أو حذفها في أي وقت.',
  ]
  const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `معلوماتي-${String(d.name ?? id).replace(/[\\/:*?"<>|]/g, '')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

/** «اتصل»، «واتساب» و«نسخة للشخص» جنب زر الحفظ بصفحة الطلب — بدون نسخ الرقم. */
export const LeadContact: React.FC = () => {
  const phone = useFormFields(([fields]) => fields.phone?.value) as string | undefined
  const { id } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  if (!phone || phone.replace(/\D/g, '').length < 9) return null
  const style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }
  const copy = async () => {
    if (!id) return
    setBusy(true)
    try {
      await downloadCopy(id)
    } catch {
      toast.error('ما قدرنا ننزّل النسخة — احفظ الطلب أولاً وجرّب كمان مرة.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <span style={{ display: 'inline-flex', gap: 8, marginInlineEnd: 8 }}>
      <a className="btn btn--style-secondary btn--size-small" style={style} href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
        <Phone size={14} /> اتصل
      </a>
      <a
        className="btn btn--style-secondary btn--size-small"
        style={style}
        href={`https://wa.me/${toWhatsApp(phone)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={14} /> واتساب
      </a>
      {id && (
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          style={style}
          onClick={copy}
          disabled={busy}
          title="ملف نصي فيه كل المعلومات المحفوظة عن هذا الشخص — لما يطلب نسخة (حق الاطلاع)"
        >
          <FileDown size={14} /> نسخة للشخص
        </button>
      )}
    </span>
  )
}
