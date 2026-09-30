import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { loadSlots } from '@/lib/media-slots-server'
import type { Media } from '@/payload-types'

import { MediaSlotsHub } from './MediaSlotsHub'
import type { HubData, MediaInfo, SlotView } from './types'

/**
 * «الفيديوهات والصور» (/admin/media-slots): كل مكان بالموقع فيه فيديو أو صورة، مع اسمه بالعربي
 * («الصفحة الرئيسية ← فيديو الكلية ← ريل ٢: …»)، معاينة، تبديل، «شوف مكانه على الموقع» و«انشر».
 * الأماكن بتنحسب من إعدادات الحقول والمحتوى (src/lib/media-slots.ts) — ريل أو دورة جديدة بتبين لحالها.
 */
export async function MediaSlotsView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Fmedia-slots')
  const { payload } = req

  // what the editor works on (latest drafts) and what visitors see now (to mark «لسا مش منشور»)
  const latest = await loadSlots(payload, { lang: 'ar', draft: true, req })
  const live = await loadSlots(payload, { lang: 'ar', draft: false, req })
  const onSite = new Map(live.slots.map((s) => [s.key, s]))

  const slots: SlotView[] = latest.slots
    .filter((s) => !s.inline)
    .map((s) => {
      const pub = onSite.get(s.key)
      const owner = latest.owners.get(s.ownerKey)
      const changed =
        Boolean(owner?.versioned) && (String(pub?.mediaId ?? '') !== String(s.mediaId ?? '') || String(pub?.poster?.mediaId ?? '') !== String(s.poster?.mediaId ?? ''))
      return { ...s, changed }
    })

  const ids = [...new Set(slots.flatMap((s) => [s.mediaId, s.poster?.mediaId]).filter((x): x is number => x !== null && x !== undefined))]
  const media: Record<string, MediaInfo> = {}
  if (ids.length) {
    const { docs } = await payload.find({ collection: 'media', where: { id: { in: ids } }, depth: 0, limit: ids.length, pagination: false, req, overrideAccess: false })
    for (const d of docs as Media[]) media[String(d.id)] = toInfo(d)
  }

  const data: HubData = {
    slots,
    media,
    owners: Object.fromEntries([...latest.owners].map(([k, o]) => [k, o])),
    focus: typeof searchParams?.focus === 'string' ? searchParams.focus : null,
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
      viewType="dashboard"
    >
      <MediaSlotsHub data={data} />
    </DefaultTemplate>
  )
}

export function toInfo(d: Media): MediaInfo {
  return {
    id: d.id,
    url: d.url ?? '',
    thumb: d.sizes?.card?.url || d.sizes?.thumbnail?.url || (d.mimeType?.startsWith('image/') ? (d.url ?? '') : ''),
    filename: d.filename ?? '',
    filesize: d.filesize ?? null,
    mimeType: d.mimeType ?? '',
    alt: typeof d.alt === 'string' ? d.alt : '',
  }
}
