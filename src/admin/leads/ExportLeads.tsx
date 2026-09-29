'use client'

import { toast, useTranslation } from '@payloadcms/ui'
import { Download, Loader2 } from 'lucide-react'
import React, { useState } from 'react'

import { adminLang, shellText } from '../i18n'
import { csvCell } from './format'

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

/**
 * «تنزيل كملف Excel» فوق جدول الطلبات: كل الطلبات بملف CSV (بيفتح بـ Excel بالعربي).
 * بيقرأ من نفس الـ API بجلسة الدخول — ما في شي بيتغيّر بقاعدة البيانات.
 */
export const ExportLeads: React.FC = () => {
  const { i18n } = useTranslation()
  const lang = adminLang(i18n)
  const t = shellText(lang).leads
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/leads?limit=5000&pagination=false&depth=1&sort=-createdAt&locale=${lang}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(String(res.status))
      const { docs } = (await res.json()) as { docs: LeadRow[] }
      const rows = docs.map((d) => [
        d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '',
        d.name,
        d.phone,
        typeof d.course === 'object' && d.course ? d.course.name : '',
        d.courseOther,
        d.message,
        d.marketingConsent ? t.marketing.yes : t.marketing.no,
        t.status[d.status ?? ''] ?? d.status,
        d.internalNotes,
        t.langs[d.locale ?? 'ar'] ?? d.locale,
      ])
      // BOM = Excel بيفهم إنه عربي/عبري (UTF-8). عمود الهاتف (3) بيضل نص — بدون ما يروح الصفر.
      const csv = '﻿' + [t.header, ...rows].map((r) => r.map((v, i) => csvCell(v, i === 2 ? 'phone' : 'text')).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${t.fileName}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Revoking right away cancels the download in some browsers
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      toast.success(t.exported(docs.length))
    } catch {
      toast.error(t.exportFailed)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        style={{ display: 'inline-flex', gap: 6, alignItems: 'center', margin: 0 }}
        onClick={download}
        disabled={busy}
      >
        {busy ? <Loader2 size={14} className="spin" /> : <Download size={14} />} {t.export}
      </button>
    </div>
  )
}
