'use client'

import { useTranslation } from '@payloadcms/ui'
import React, { useEffect } from 'react'

/**
 * قبل ما تنمسح صورة (من صفحتها أو كم صورة من القائمة): إذا هي مستعملة بالموقع بنسأل
 * «هاي الصورة مستعملة بـ …، متأكد؟». بس لما تجاوب «نعم» الطلب بيروح للسيرفر مع
 * `x-media-delete-confirmed: 1` (السيرفر بيرفض المسح بدونه — src/hooks/mediaInUse.ts).
 *
 * Payload's own delete buttons (single + bulk) send `DELETE /api/media…` with fetch; this wraps
 * fetch once for the admin, only for those requests.
 */
type Item = { id: number | string; name: string; places: string[] }

const MEDIA_DELETE = /\/api\/media(?:\/([^/?#]+))?\/?(?:\?|$)/

const texts = (he: boolean) =>
  he
    ? {
        one: (it: Item) => `התמונה הזאת מופיעה באתר ב:\n${it.places.map((p) => `• ${p}`).join('\n')}\n\nאם תמחקו אותה, היא תיעלם מהמקומות האלה. בטוחים שרוצים למחוק?`,
        many: (items: Item[]) =>
          `${items.length} מהקבצים שבחרתם מופיעים באתר:\n${items.map((it) => `• «${it.name}»: ${it.places.join(' · ')}`).join('\n')}\n\nאם תמחקו אותם, הם ייעלמו מהמקומות האלה. בטוחים שרוצים למחוק?`,
        cancelled: 'לא נמחק דבר.',
        kept: 'התמונות נשארות באתר כמו שהן.',
      }
    : {
        one: (it: Item) => `هاي الصورة مستعملة بالموقع بـ:\n${it.places.map((p) => `• ${p}`).join('\n')}\n\nإذا مسحتها بتختفي من هالأماكن. متأكد إنك بدك تمسحها؟`,
        many: (items: Item[]) =>
          `${items.length} من الصور اللي اخترتها مستعملة بالموقع:\n${items.map((it) => `• «${it.name}»: ${it.places.join(' · ')}`).join('\n')}\n\nإذا مسحتها بتختفي من هالأماكن. متأكد إنك بدك تمسحها؟`,
        cancelled: 'ما انمسح إشي.',
        kept: 'الصور بضلّها بالموقع زي ما هي.',
      }

let installed = false
/** Admin language (Payload's, kept current by the provider below) */
let adminLanguage = ''

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(href, window.location.href)
    const match = method === 'DELETE' && url.origin === window.location.origin ? url.pathname.match(MEDIA_DELETE) : null
    if (!match || match[1] === 'in-use') return original(input, init)

    // Same selection as the delete: one picture (/api/media/5) or the list's where[…] (bulk)
    const query = match[1] ? `where[id][equals]=${encodeURIComponent(decodeURIComponent(match[1]))}` : url.search.slice(1)
    let items: Item[] = []
    try {
      const res = await original(`/api/media/in-use?${query}`, { credentials: 'include' })
      if (res.ok) items = ((await res.json()) as { items: Item[] }).items ?? []
    } catch {
      // Can't tell → send the delete as is; the server refuses it if the picture is in use.
      return original(input, init)
    }
    if (items.length) {
      const t = texts((adminLanguage || document.documentElement.lang) === 'he')
      if (!window.confirm(items.length === 1 ? t.one(items[0]) : t.many(items))) {
        // Shape of Payload's delete answer: one picture shows errors[].message; the bulk delete
        // shows message + errors as the description (and reads docs)
        const body = { docs: [], errors: [{ message: match[1] ? `${t.cancelled} ${t.kept}` : t.kept }], message: t.cancelled }
        return new Response(JSON.stringify(body), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      }
    }
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    headers.set('x-media-delete-confirmed', '1')
    return original(input, { ...init, headers })
  }
}

export function MediaDeleteGuard({ children }: { children?: React.ReactNode }) {
  const { i18n } = useTranslation()
  useEffect(() => {
    adminLanguage = i18n.language
  }, [i18n.language])
  useEffect(install, [])
  return <>{children}</>
}
