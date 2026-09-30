'use client'

import { useTranslation } from '@payloadcms/ui'
import Link from 'next/link'
import type { UIFieldClientComponent } from 'payload'
import React from 'react'

const TEXT = {
  ar: {
    title: 'القصص اللي بتطلع هون بتختارها من صفحة قصص النجاح — زر «اعرضها بالرئيسية».',
    how: 'على بطاقة الخريج: اضغط «اعرضها بالرئيسية» وبعدين «انشر». الترتيب هون = ترتيب البطاقات هناك.',
    link: 'افتح صفحة قصص النجاح ←',
  },
  he: {
    title: 'הסיפורים שמוצגים כאן נבחרים בעמוד סיפורי ההצלחה — בכפתור «להציג בדף הבית».',
    how: 'בכרטיס הבוגר/ת: לחצו «להציג בדף הבית» ואז «פרסום». הסדר כאן = סדר הכרטיסים שם.',
    link: '← לעמוד סיפורי ההצלחה',
  },
}

/**
 * الصفحة الرئيسية ← قسم «قصص نجاح»: ما في اختيار هون (من 2026-09-30).
 * بس ملاحظة ورابط لصفحة قصص النجاح، وين الزر «اعرضها بالرئيسية» على كل بطاقة.
 */
export const StoriesPickNotice: UIFieldClientComponent = () => {
  const { i18n } = useTranslation()
  const t = TEXT[i18n?.language === 'he' ? 'he' : 'ar']
  return (
    <div
      role="note"
      style={{
        border: '1px solid #b7e1c5',
        background: '#eef8f1',
        color: '#0b3d1f',
        borderRadius: 12,
        padding: '12px 16px',
        margin: '0 0 16px',
        lineHeight: 1.7,
        fontSize: 14,
      }}
    >
      <strong>⭐ {t.title}</strong>
      <div style={{ opacity: 0.85, fontSize: 13 }}>{t.how}</div>
      <Link
        href="/admin/collections/success-stories"
        style={{
          display: 'inline-block',
          marginTop: 8,
          borderRadius: 999,
          padding: '5px 14px',
          background: 'var(--brand-600, #158942)',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        {t.link}
      </Link>
    </div>
  )
}
