'use client'

/**
 * التعديل المباشر على البطاقات بيحكي مع Payload عبر REST (/api/...) بنفس جلسة الدخول.
 * أي رفض من قواعد الكلية (سعر، ضمان تشغيل) بيرجع كرسالة مفهومة.
 */
export type Locale = 'ar' | 'he'

export class ApiError extends Error {}

/** أسماء خانات البطاقات، لما الغلط بيرجع بدون اسم الخانة (مثلاً «القيمة لازم تكون فريدة») */
const FIELD_LABELS: Record<string, string> = {
  slug: 'الرابط (slug) — مستعمل بعنصر ثاني',
  name: 'الاسم',
  title: 'العنوان',
  graduateName: 'اسم الخريج/ة',
  role: 'الوظيفة',
  logo: 'اللوغو',
  alt: 'وصف الصورة',
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  const json = (await res.json().catch(() => ({}))) as {
    errors?: { message?: string; data?: { errors?: { message?: string; label?: string; path?: string }[] } }[]
    doc?: T
  } & T
  if (!res.ok) {
    const e = json.errors?.[0]
    const detail = e?.data?.errors
      ?.map((x) => {
        // قواعد الكلية بتكتب الشرح كامل بالـ label؛ غير هيك منحط اسم الخانة قبل الغلط
        if (typeof x.label === 'string' && x.label.includes(' — ')) return x.label
        const field = typeof x.label === 'string' && x.label ? x.label : x.path ? (FIELD_LABELS[x.path] ?? '') : ''
        return field && x.message ? `«${field}»: ${x.message}` : x.message
      })
      .filter(Boolean)
      .join(' · ')
    throw new ApiError(detail || e?.message || 'ما قدرنا نحفظ — جرّب كمان مرة.')
  }
  return (json.doc ?? json) as T
}

export function updateDoc(collection: string, id: number | string, data: Record<string, unknown>, opts: { locale: Locale; draft: boolean }) {
  const q = new URLSearchParams({ locale: opts.locale, depth: '0' })
  if (opts.draft) q.set('draft', 'true')
  return call<{ id: number }>(`/api/${collection}/${id}?${q}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function createDoc(collection: string, data: Record<string, unknown>, opts: { locale: Locale; draft: boolean }) {
  const q = new URLSearchParams({ locale: opts.locale, depth: '0' })
  if (opts.draft) q.set('draft', 'true')
  return call<{ id: number }>(`/api/${collection}?${q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteDoc(collection: string, id: number | string) {
  return call<{ id: number }>(`/api/${collection}/${id}`, { method: 'DELETE' })
}

/** يرفع صورة لمكتبة الصور ويرجّع رقمها ورابطها. الوصف (alt) إجباري بالمكتبة — منحط الاسم. */
export async function uploadMedia(file: File, alt: string, locale: Locale) {
  const form = new FormData()
  form.set('file', file)
  form.set('_payload', JSON.stringify({ alt: alt || file.name }))
  const doc = await call<{ id: number; url?: string; sizes?: Record<string, { url?: string }> }>(`/api/media?locale=${locale}&depth=0`, {
    method: 'POST',
    body: form,
  })
  return { id: doc.id, url: doc.sizes?.card?.url || doc.url || '' }
}
