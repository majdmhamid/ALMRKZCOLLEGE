'use client'

import { useField, useRowLabel } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

/**
 * صفحة «الصفحة الرئيسية»: صف الريل المسكّر بيحكي شو هو («ريل ٢: تركيب مكيفات — دورة: فني تكييف · 🎬»)،
 * وخانة الفيديو بتعرض الفيديو المختار صغير (بدل اسم ملف بس).
 */
type Id = number | string
const idOf = (v: unknown): Id | null =>
  typeof v === 'number' || typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? ((v as { id: Id }).id ?? null) : null

const cache = new Map<string, Promise<Record<string, unknown> | null>>()
/** One read per document for the whole page */
function readOnce(url: string) {
  let p = cache.get(url)
  if (!p) {
    p = fetch(url, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
      .catch(() => null)
    cache.set(url, p)
  }
  return p
}

function useDoc(collection: string, id: Id | null, extra = '') {
  const url = id === null ? null : `/api/${collection}/${encodeURIComponent(String(id))}?depth=0${extra}`
  const [read, setRead] = useState<{ url: string; doc: Record<string, unknown> | null } | null>(null)
  useEffect(() => {
    let alive = true
    if (url) void readOnce(url).then((doc) => alive && setRead({ url, doc }))
    return () => {
      alive = false
    }
  }, [url])
  return read && read.url === url ? read.doc : null
}

const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

export const ReelRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ title?: string; course?: unknown; video?: unknown }>()
  const course = useDoc('courses', idOf(data?.course), '&locale=ar&draft=true')
  const n = toArabicDigits((rowNumber ?? 0) + 1)
  if (!data?.title) return <span>ريل {n} <span style={{ opacity: 0.6 }}>— جديد، اضغط هون لتعبّيه ▾</span></span>
  const courseName = typeof course?.name === 'string' ? course.name : ''
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <b>
        ريل {n}: {data.title}
      </b>
      {courseName && <span style={{ opacity: 0.75 }}>— دورة: {courseName}</span>}
      <span style={{ fontSize: 12, padding: '1px 8px', borderRadius: 99, background: 'var(--theme-elevation-100)' }}>
        {idOf(data.video) !== null ? '🎬 فيه فيديو' : 'بدون فيديو'}
      </span>
    </span>
  )
}

/** Under a video field: the chosen video, small and playable */
export const VideoThumb: React.FC = () => {
  const { value } = useField<unknown>()
  const media = useDoc('media', idOf(value))
  const url = typeof media?.url === 'string' ? media.url : ''
  if (!url || !String(media?.mimeType ?? '').startsWith('video/')) return null
  return (
    <video
      src={`${url}#t=0.5`}
      controls
      preload="metadata"
      playsInline
      style={{ display: 'block', marginTop: 8, maxWidth: 260, maxHeight: 180, borderRadius: 10, background: '#10201a' }}
    />
  )
}
