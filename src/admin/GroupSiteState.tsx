'use client'

import { toast, useDocumentInfo, useTranslation } from '@payloadcms/ui'
import React, { useEffect, useRef, useState } from 'react'

import { groupState, groupStateText, type GroupState } from '@/lib/group-visibility'

const get = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)) as Promise<
    Record<string, unknown> | null
  >

/**
 * صفحة المجال (جنب «نشر التّغييرات»): هل المجال ظاهر بالموقع؟ وإذا لأ — ليش.
 * نفس قاعدة الموقع (lib/group-visibility.ts). بعد النشر لمجال بدون دورات منشورة
 * بتطلع رسالة: «المجال انحفظ، بس رح يبين بالموقع لما تضيف إله دورة منشورة».
 */
export const GroupSiteState: React.FC = () => {
  const { id, lastUpdateTime, mostRecentVersionIsAutosaved } = useDocumentInfo()
  const { i18n } = useTranslation()
  const t = groupStateText(i18n?.language)
  const [state, setState] = useState<GroupState | null>(null)
  const firstUpdate = useRef(lastUpdateTime)
  const announced = useRef<number | undefined>(undefined)
  const text = useRef(t)
  useEffect(() => {
    text.current = t
  })

  useEffect(() => {
    if (!id) return
    // بعد «نشر التّغييرات» (مش الحفظ التلقائي وقت الكتابة) — Payload بيعلّم هيك بعد النشر
    const published = lastUpdateTime !== firstUpdate.current && !mostRecentVersionIsAutosaved
    let cancelled = false
    void (async () => {
      const [group, courses] = await Promise.all([
        get(`/api/course-groups/${id}?depth=0&select[_status]=true`),
        get(
          `/api/courses?depth=0&limit=1&select[group]=true` +
            `&where[and][0][group][equals]=${id}&where[and][1][_status][equals]=published`,
        ),
      ])
      if (cancelled || !group) return
      const next = groupState(group._status as string, Number(courses?.totalDocs ?? 0) > 0)
      setState(next)
      if (published && next === 'noCourses' && announced.current !== lastUpdateTime) {
        announced.current = lastUpdateTime
        toast.info(text.current.savedNoCourses, { duration: 15000 })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, lastUpdateTime, mostRecentVersionIsAutosaved])

  // مجال جديد لسا ما انحفظ
  const shown: GroupState = id ? (state ?? 'draft') : 'draft'
  if (id && !state) return null
  const on = shown === 'visible'
  return (
    <div
      style={{
        border: `1px solid ${on ? 'var(--brand-200, #c4e2a8)' : '#f0c36d'}`,
        background: on ? 'var(--brand-50, #f1f8ec)' : '#fff8e6',
        color: on ? 'var(--brand-800, #0b5027)' : '#6b4a00',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 16,
        lineHeight: 1.7,
        fontSize: 13,
      }}
    >
      <strong style={{ fontSize: 14 }}>
        {on ? '✓ ' : '⚠ '}
        {t[shown]}
      </strong>
      {shown === 'draft' && <div>{t.draftHint}</div>}
      <div style={{ marginTop: 4, opacity: 0.85 }}>{t.hint}</div>
    </div>
  )
}
