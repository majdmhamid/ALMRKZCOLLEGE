'use client'

import { toast } from '@payloadcms/ui'
import { Download, Loader2 } from 'lucide-react'
import React, { useState } from 'react'

type LeadRow = {
  name?: string
  phone?: string
  course?: { name?: string } | number | null
  courseOther?: string | null
  message?: string | null
  marketingConsent?: boolean | null
  status?: string
  internalNotes?: string | null
  locale?: string | null
  createdAt?: string
}

const STATUS: Record<string, string> = { new: 'جديد', contacted: 'تمّ التواصل', closed: 'مغلق' }

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`

/**
 * «تنزيل كملف Excel» فوق جدول الطلبات: كل الطلبات بملف CSV (بيفتح بـ Excel بالعربي).
 * بيقرأ من نفس الـ API بجلسة الدخول — ما في شي بيتغيّر بقاعدة البيانات.
 */
export const ExportLeads: React.FC = () => {
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/leads?limit=5000&pagination=false&depth=1&sort=-createdAt&locale=ar', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(String(res.status))
      const { docs } = (await res.json()) as { docs: LeadRow[] }
      const header = ['التاريخ', 'الاسم', 'الهاتف', 'الدورة', 'دورة أخرى / غير متأكد', 'الرسالة', 'رسائل تسويقية', 'الحالة', 'ملاحظات داخلية', 'لغة الصفحة']
      const rows = docs.map((d) => [
        d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '',
        d.name,
        d.phone,
        typeof d.course === 'object' && d.course ? d.course.name : '',
        d.courseOther,
        d.message,
        d.marketingConsent ? 'وافق' : 'لا',
        STATUS[d.status ?? ''] ?? d.status,
        d.internalNotes,
        d.locale === 'he' ? 'عبري' : 'عربي',
      ])
      // BOM = Excel بيفهم إنه عربي (UTF-8)
      const csv = '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `طلبات-الموقع-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(docs.length ? `نزل ملف فيه ${docs.length} طلب.` : 'لسا ما في طلبات.')
    } catch {
      toast.error('ما قدرنا ننزّل الملف — جرّب كمان مرة.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', margin: 0 }} onClick={download} disabled={busy}>
        {busy ? <Loader2 size={14} className="spin" /> : <Download size={14} />} تنزيل كل الطلبات كملف Excel
      </button>
    </div>
  )
}
