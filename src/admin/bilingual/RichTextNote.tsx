'use client'

import { useLocale } from '@payloadcms/ui'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

import './bilingual.scss'

/**
 * تحت النص الطويل (المحرّر): المحرّر بيشتغل بلغة وحدة بكل مرة، فهون زر بيفتح نفس الصفحة
 * باللغة الثانية. باقي الخانات بالصفحة فيها العربي والعبري جنب بعض.
 */
export function RichTextNote() {
  const current = useLocale().code === 'he' ? 'he' : 'ar'
  const other = current === 'ar' ? 'he' : 'ar'
  const pathname = usePathname()
  const params = new URLSearchParams(useSearchParams()?.toString())
  params.set('locale', other)
  return (
    <div className="bi__rich-note">
      النص الطويل بينكتب بلغة وحدة بكل مرة.{' '}
      <a href={`${pathname}?${params}`}>
        {other === 'he' ? 'اكتبه بالعبري ←' : 'اكتبه بالعربي ←'}
      </a>
    </div>
  )
}
