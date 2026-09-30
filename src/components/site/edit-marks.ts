import 'server-only'

import { cache } from 'react'

import { EDIT_ATTR, type EditMark, type FieldSpec } from '@/lib/edit-marks'

/*
 * Marks for «عدّل الموقع» (src/admin/edit-site): `data-edit` attributes on the elements staff
 * can click to edit. Only written for a request in preview (draft) mode — `isDraft()` in data.ts
 * switches them on — so visitors get exactly the same HTML as before (no attributes at all).
 */

/** Per request (React cache): are marks on? */
const state = cache(() => ({ on: false }))

export const enableEditMarks = () => {
  state().on = true
}

export type Marks = Record<string, string> | undefined

export function mark(m: EditMark): Marks {
  return state().on ? { [EDIT_ATTR]: JSON.stringify(m) } : undefined
}

/** «collection/id» */
export const col = (slug: string, id: number | string) => `${slug}/${id}`

/** A text of a document (edited in place). */
export const txt = (d: string, p: string, l: string, long = false): Marks =>
  mark({ d, p, k: long ? 'textarea' : 'text', l })

/** A small dialog with several fields (image, video, poster, duration…). */
export const box = (d: string, p: string, l: string, f: FieldSpec[]): Marks => mark({ d, p, k: 'fields', l, f })

/** One image / video field of a document. */
export const pic = (d: string, p: string, l: string, type: 'image' | 'video' = 'image'): Marks =>
  box(d, '', l, [[p, type, l]])

/** Can't be edited here (long formatted text…): the chip offers the full form. */
export const formOnly = (d: string, l: string): Marks => mark({ d, p: '', k: 'form', l })

/** Names of the homepage sections, for the chip («العنوان — فيديو الكلية»). */
const SECTION_NAMES: Record<string, string> = {
  hero: 'الواجهة',
  stats: 'الأرقام',
  courseGroups: 'مجالات التأهيل',
  featuredCourses: 'أبرز الدورات',
  why: 'ليش كلية المركز',
  successStories: 'قصص النجاح',
  staff: 'طاقم الكلية',
  videos: 'فيديو الكلية',
  news: 'آخر الأخبار',
  partners: 'الشركاء',
  employers: 'للشركات',
  faq: 'أسئلة شائعة',
  register: 'التسجيل',
  gallery: 'صور الورشات',
}

/**
 * Marks for one homepage section: `m.t('title', 'العنوان')` → the section's title,
 * `m.f('promo', 'الفيديو التعريفي', [...])` → a dialog. Paths use the fixed row ids.
 */
export function sectionMarks(b: { id?: string | null; blockType: string }) {
  const base = `sections.#${b.id}`
  const name = SECTION_NAMES[b.blockType] ?? 'قسم'
  const at = (sub: string) => (sub ? `${base}.${sub}` : base)
  return {
    t: (field: string, what: string, long = false) => txt('homepage', at(field), `${what} — ${name}`, long),
    f: (sub: string, what: string, specs: FieldSpec[]) => box('homepage', at(sub), `${what} — ${name}`, specs),
  }
}

/** Texts shared by the whole site («النصوص الثابتة»): «تفاصيل الدورة», «اقرأ المزيد»… */
export const uiText = (path: string, what: string) => txt('ui-texts', path, `${what} — النصوص الثابتة`)

/** Marks of one graduate story (the rotating «قصص النجاح» section). */
export function storyMarks(s: { id: number; graduateName?: string | null }) {
  const d = col('success-stories', s.id)
  const quote = txt(d, 'quote', `الاقتباس: ${s.graduateName ?? ''}`, true)
  if (!quote) return undefined
  return {
    quote,
    body: txt(d, 'excerpt', `ملخّص القصة: ${s.graduateName ?? ''}`, true),
    name: txt(d, 'graduateName', 'اسم الخريج/ة'),
    now: txt(d, 'currentRole', `شو بيشتغل اليوم: ${s.graduateName ?? ''}`),
    photo: box(d, '', `صورة وفيديو الخريج: ${s.graduateName ?? ''}`, [
      ['photo', 'image', 'صورة الخريج/ة'],
      ['video', 'video', 'فيديو القصة (اختياري)'],
      ['videoDuration', 'plain', 'مدة الفيديو (مثلاً 0:45)'],
    ]),
  }
}
