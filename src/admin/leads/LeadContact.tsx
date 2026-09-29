'use client'

import { useFormFields, useTranslation } from '@payloadcms/ui'
import { MessageCircle, Phone } from 'lucide-react'
import React from 'react'

import { adminLang, shellText } from '../i18n'
import { toTel, toWhatsApp } from './format'

/** «اتصل» و«واتساب» جنب زر الحفظ بصفحة الطلب — بدون نسخ الرقم. */
export const LeadContact: React.FC = () => {
  const phone = useFormFields(([fields]) => fields.phone?.value) as string | undefined
  const { i18n } = useTranslation()
  const t = shellText(adminLang(i18n)).leads
  if (!phone || phone.replace(/\D/g, '').length < 9) return null
  const style: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }
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
    </span>
  )
}
