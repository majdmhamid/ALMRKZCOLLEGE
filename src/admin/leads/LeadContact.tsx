'use client'

import { useFormFields } from '@payloadcms/ui'
import { MessageCircle, Phone } from 'lucide-react'
import React from 'react'

/** 050-1234567 → 972501234567 (for wa.me). Numbers already in international form stay. */
export function toWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('972')) return digits
  if (digits.startsWith('0')) return `972${digits.slice(1)}`
  return digits
}

/** «اتصل» و«واتساب» جنب زر الحفظ بصفحة الطلب — بدون نسخ الرقم. */
export const LeadContact: React.FC = () => {
  const phone = useFormFields(([fields]) => fields.phone?.value) as string | undefined
  if (!phone || phone.replace(/\D/g, '').length < 9) return null
  const style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }
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
    </span>
  )
}
