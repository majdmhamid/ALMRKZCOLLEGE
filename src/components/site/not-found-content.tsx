import React from 'react'

import type { SiteLocale } from '@/lib/rules'

/** Texts of the 404 page (kept in code: they must work even when the database is empty). */
const T: Record<SiteLocale, { title: string; text: string; home: string; courses: string }> = {
  ar: {
    title: 'الصفحة غير موجودة',
    text: 'يبدو أن الرابط غير صحيح، أو أن الصفحة نُقلت أو حُذفت. يمكنك الرجوع إلى الصفحة الرئيسية أو تصفّح الدورات.',
    home: 'إلى الصفحة الرئيسية',
    courses: 'كل الدورات',
  },
  he: {
    title: 'הדף לא נמצא',
    text: 'נראה שהקישור שגוי, או שהדף הועבר או נמחק. אפשר לחזור לדף הבית או לעיין בקורסים.',
    home: 'לדף הבית',
    courses: 'כל הקורסים',
  },
}

/** Body of the 404 page in one language (used by [locale]/not-found.tsx). */
export function NotFoundContent({ locale }: { locale: SiteLocale }) {
  const t = T[locale]
  return (
    <div style={{ padding: '160px 20px 80px', textAlign: 'center' }}>
      <p className="h2" aria-hidden="true" style={{ color: '#158942' }}>
        404
      </p>
      <h1 className="h2" style={{ fontSize: 'clamp(24px,3.5vw,36px)' }}>
        {t.title}
      </h1>
      <p className="lead" style={{ margin: '12px auto' }}>
        {t.text}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
          marginTop: 16,
        }}
      >
        <a href={`/${locale}`} className="btn btn-green" style={{ height: 48, padding: '0 20px' }}>
          {t.home}
        </a>
        <a
          href={`/${locale}/courses`}
          className="btn btn-outline"
          style={{ height: 48, padding: '0 20px' }}
        >
          {t.courses}
        </a>
      </div>
    </div>
  )
}
