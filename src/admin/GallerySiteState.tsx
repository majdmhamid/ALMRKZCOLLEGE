'use client'

import { useTranslation } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

const TEXT = {
  ar: {
    on: '✓ ظاهر بالموقع — بقسم «صور من الورشات» بالصفحة الرئيسية وبصفحة «عن الكلية».',
    hidden: '⚠ مخفي: قسم «صور من الورشات» بالصفحة الرئيسية معلّم «مخفي».',
    missing: '⚠ مخفي: الصور والفيديوهات هون بتظهر بس بقسم «صور من الورشات» — وهاد القسم مش موجود بالصفحة الرئيسية.',
    how: 'لإظهارها: «الصفحة الرئيسية للموقع» ← «أضف قسم» ← «صور من الورشات» ← «نشر التّغييرات».',
    howHidden: 'لإظهارها: «الصفحة الرئيسية للموقع» ← افتح القسم ← شيل علامة «إخفاء هذا القسم مؤقتاً» ← «نشر التّغييرات».',
  },
  he: {
    on: '✓ מוצג באתר — בחלק «תמונות מהסדנאות» בדף הבית ובדף «אודות».',
    hidden: '⚠ מוסתר: החלק «תמונות מהסדנאות» בדף הבית מסומן «מוסתר».',
    missing: '⚠ מוסתר: התמונות והסרטונים כאן מוצגים רק בחלק «תמונות מהסדנאות» — והחלק הזה לא קיים בדף הבית.',
    how: 'כדי להציג: «דף הבית של האתר» ← הוספת חלק ← «תמונות מהסדנאות» ← «פרסם שינויים».',
    howHidden: 'כדי להציג: «דף הבית של האתר» ← פותחים את החלק ← מורידים את הסימון «הסתרה זמנית» ← «פרסם שינויים».',
  },
}

type State = 'on' | 'hidden' | 'missing'

/**
 * «معرض الصور والفيديو» ما إله صفحة لحاله: بيظهر بس إذا الصفحة الرئيسية فيها قسم «صور من الورشات»
 * (وبصفحة «عن الكلية» معه). بدون هاد التنبيه مجد بيعدّل المعرض وما بيشوف شي بيتغيّر.
 */
export const GallerySiteState: React.FC = () => {
  const { i18n } = useTranslation()
  const t = TEXT[i18n?.language === 'he' ? 'he' : 'ar']
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    let cancelled = false
    void fetch('/api/globals/homepage?depth=0', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((home: { sections?: { blockType?: string; hidden?: boolean | null }[] } | null) => {
        if (cancelled || !home) return
        const blocks = (home.sections ?? []).filter((s) => s.blockType === 'gallery')
        setState(blocks.some((b) => !b.hidden) ? 'on' : blocks.length ? 'hidden' : 'missing')
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  if (!state) return null
  const on = state === 'on'
  return (
    <div
      role="status"
      style={{
        border: `1px solid ${on ? 'var(--brand-200, #c4e2a8)' : '#f0c36d'}`,
        background: on ? 'var(--brand-50, #f1f8ec)' : '#fff8e6',
        color: on ? 'var(--brand-800, #0b5027)' : '#5c3f00',
        borderRadius: 12,
        padding: '10px 14px',
        margin: '0 0 20px',
        lineHeight: 1.7,
        fontSize: 14,
      }}
    >
      <strong>{t[state]}</strong>
      {!on && <div>{state === 'hidden' ? t.howHidden : t.how}</div>}
    </div>
  )
}
