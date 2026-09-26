'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/** Shows the item's own text on collapsed rows instead of «عنصر 01». */
export const LabelRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <span>{data?.label || `عنصر ${String((rowNumber ?? 0) + 1)}`}</span>
}

export const TitleRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ title?: string }>()
  return <span>{data?.title || `عمود ${String((rowNumber ?? 0) + 1)}`}</span>
}

export const QuestionRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ question?: string }>()
  return <span>{data?.question || `سؤال ${String((rowNumber ?? 0) + 1)}`}</span>
}

const SECTION_NAMES: Record<string, string> = {
  hero: 'الواجهة (فيديو كبير)',
  stats: 'أرقام',
  courseGroups: 'مجالات التأهيل',
  featuredCourses: 'أبرز الدورات',
  why: 'ليش كلية المركز؟',
  successStories: 'قصص نجاح',
  staff: 'طاقم الكلية',
  videos: 'فيديو الكلية',
  news: 'آخر الأخبار',
  partners: 'شركاء',
  employers: 'للشركات والمشغّلين',
  faq: 'أسئلة شائعة',
  register: 'استمارة التسجيل',
  gallery: 'صور من الورشات',
}

/** Homepage section header: number, section type, its title, and a marker when hidden. */
export const SectionRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{
    blockType?: string
    title?: string
    hidden?: boolean
    items?: { label?: string }[]
  }>()
  const type = SECTION_NAMES[data?.blockType ?? ''] ?? data?.blockType ?? ''
  const title =
    data?.title ||
    data?.items
      ?.map((i) => i.label)
      .filter(Boolean)
      .join(' · ') ||
    ''
  return (
    <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
      <span style={{ opacity: 0.6 }}>{String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          background: 'var(--theme-elevation-100)',
          fontWeight: 600,
        }}
      >
        {type}
      </span>
      <span style={{ opacity: data?.hidden ? 0.5 : 0.85 }}>{title}</span>
      {data?.hidden ? <span style={{ color: 'var(--theme-error-500)' }}>🚫 مخفي</span> : null}
    </span>
  )
}
