'use client'

import { toast } from '@payloadcms/ui'
import { Loader2, Trash2 } from 'lucide-react'
import React, { useState } from 'react'

/**
 * «احذف الطلبات القديمة الآن» فوق جدول الطلبات. نفس الشي بيصير لحاله كل ليلة (Vercel cron ←
 * /api/privacy/purge-leads)؛ الزر لمن بدو يتأكد أو يطبّق مدة جديدة فوراً. المدة من «معلومات الكلية».
 */
export const PurgeLeads: React.FC = () => {
  const [busy, setBusy] = useState(false)
  const purge = async () => {
    if (!window.confirm('حذف كل الطلبات الأقدم من مدة الاحتفاظ المحدّدة في «معلومات الكلية»؟ ما بترجع.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/privacy/purge-leads', { method: 'POST', credentials: 'include' })
      if (!res.ok) throw new Error(String(res.status))
      const { deleted, months } = (await res.json()) as { deleted: number; months: number }
      toast.success(
        deleted ? `انحذف ${deleted} طلب أقدم من ${months} شهر.` : `ما في طلبات أقدم من ${months} شهر — كل إشي تمام.`,
      )
      if (deleted) window.location.reload()
    } catch {
      toast.error('ما قدرنا نحذف — جرّب كمان مرة.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <button
      type="button"
      className="btn btn--style-secondary btn--size-small"
      style={{ display: 'inline-flex', gap: 6, alignItems: 'center', margin: '0 0 12px 8px' }}
      onClick={purge}
      disabled={busy}
      title="بينحذفوا لحالهم كل ليلة؛ الزر لتطبيق فوري"
    >
      {busy ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />} احذف الطلبات القديمة الآن
    </button>
  )
}
