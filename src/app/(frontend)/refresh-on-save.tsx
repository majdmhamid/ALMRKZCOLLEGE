'use client'

import { RefreshRouteOnSave as PayloadRefresh } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

/**
 * Live preview inside /admin: reload the page whenever the editor saves.
 * Kept in its own file so the live-preview library is only downloaded in preview mode,
 * never by ordinary visitors.
 */
export function RefreshRouteOnSave({ serverURL }: { serverURL: string }) {
  const router = useRouter()
  return <PayloadRefresh refresh={() => router.refresh()} serverURL={serverURL} />
}

const TEXT = {
  ar: {
    note: 'معاينة: بتشوف التعديلات اللي لسّا ما انتشرت. الزوار بيشوفوا النسخة المنشورة بس.',
    exit: 'اخرج من المعاينة',
  },
  he: {
    note: 'תצוגה מקדימה: רואים שינויים שעוד לא פורסמו. המבקרים רואים רק את הגרסה המפורסמת.',
    exit: 'יציאה מהתצוגה המקדימה',
  },
}

/**
 * «معاينة» in /admin turns on preview (draft) mode for this browser — it stays on for the
 * whole visit. Without a sign, the owner opened the site later, saw unpublished drafts and
 * thought they were live. Not shown inside the live-preview panel of the admin (an iframe).
 */
export function PreviewBanner({ locale }: { locale: 'ar' | 'he' }) {
  const [exitHref, setExitHref] = useState<string | null>(null)
  useEffect(() => {
    try {
      if (window.self !== window.top) return
      const here = window.location.pathname + window.location.search + window.location.hash
      // eslint-disable-next-line react-hooks/set-state-in-effect -- window is only known here
      setExitHref(`/next/exit-preview?path=${encodeURIComponent(here)}`)
    } catch {
      // inside a cross-origin frame: no banner
    }
  }, [])
  if (!exitHref) return null
  const t = TEXT[locale]
  return (
    <div
      role="status"
      className="preview-banner"
      dir="rtl"
      style={{
        position: 'fixed',
        insetInline: 12,
        zIndex: 2147483000,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        maxWidth: 720,
        margin: '0 auto',
        padding: '10px 14px',
        borderRadius: 14,
        background: '#fff8e6',
        border: '1px solid #f0c36d',
        color: '#5c3f00',
        boxShadow: '0 8px 24px rgb(0 0 0 / 0.18)',
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {/* above the phone tab bar (hidden from 1024px) */}
      <style>{`.preview-banner{bottom:calc(96px + env(safe-area-inset-bottom))}@media (min-width:1024px){.preview-banner{bottom:12px}}@media print{.preview-banner{display:none!important}}`}</style>
      <span>👁 {t.note}</span>
      <a
        href={exitHref}
        style={{
          border: 0,
          borderRadius: 999,
          padding: '6px 14px',
          background: '#0f6b33',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        {t.exit}
      </a>
    </div>
  )
}
