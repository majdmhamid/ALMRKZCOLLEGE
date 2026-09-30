import type { Payload, PayloadRequest } from 'payload'
import React from 'react'

import { allMediaUsage, mediaUsage, type Place } from '@/lib/media-slots-server'

import './media-slots.scss'

/**
 * «مستعمل في:» بمكتبة الصور والفيديو — نفس أسماء الأماكن تبع «الفيديوهات والصور»، وكل مكان رابط
 * لبطاقته هناك (للتبديل). ملف مش مستعمل: «مش مستعمل بأي مكان».
 */

/** Column in the media list (server cell; one walk for the whole page — allMediaUsage) */
export async function MediaUsedInCell({ rowData, payload }: { rowData?: { id?: number | string }; payload?: Payload }) {
  if (!payload || rowData?.id === undefined) return null
  const places = (await allMediaUsage(payload)).get(String(rowData.id)) ?? []
  if (!places.length) return <span className="media-used media-used__none">مش مستعمل بأي مكان</span>
  const shown = places.slice(0, 2)
  return (
    <span className="media-used" title={places.map((p) => p.label).join('\n')}>
      {shown.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' · '}
          <a href={p.href}>
            {short(p)}
          </a>
        </React.Fragment>
      ))}
      {places.length > shown.length && ` (+${places.length - shown.length})`}
    </span>
  )
}

/** «الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: …» is long for a table cell: first + last step */
const short = (p: Place) => {
  const steps = p.label.split(' ← ')
  return steps.length > 2 ? `${steps[0]} ← … ← ${steps[steps.length - 1]}` : p.label
}

/** Top of a media file's edit page */
export async function MediaUsedInField({ id, payload, req }: { id?: number | string; payload?: Payload; req?: PayloadRequest }) {
  // a new file (upload drawer) isn't used anywhere yet — nothing to say
  if (!payload || id === undefined || id === null || id === '') return null
  let places: Place[] = []
  try {
    places = (await mediaUsage(payload, [id], { lang: req?.i18n?.language === 'he' ? 'he' : 'ar' })).get(String(id)) ?? []
  } catch (err) {
    payload.logger.error({ err, msg: 'media usage failed' })
    return null
  }
  if (!places.length)
    return (
      <div className="media-used media-used--field is-unused">
        <b>مش مستعمل بأي مكان</b> — هاد الملف بالمكتبة بس، ما بيبين على الموقع.
      </div>
    )
  return (
    <div className="media-used media-used--field">
      <b>مستعمل في:</b>
      <ul>
        {places.map((p, i) => (
          <li key={i}>
            <a href={p.href}>{p.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
