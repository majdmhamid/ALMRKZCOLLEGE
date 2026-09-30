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

export async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  const json = (await res.json().catch(() => ({}))) as {
    errors?: { message?: string; data?: { errors?: { message?: string; label?: string; path?: string }[] } }[]
    doc?: T
  } & T
  if (!res.ok) {
    if (res.status === 413)
      throw new ApiError('الملف كبير كتير للرفع من هون. صغّر الصورة (أو ارفعها من «مكتبة الصور والفيديو» ← «إنشاء جديد») وجرّب كمان مرة.')
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

export function updateDoc(
  collection: string,
  id: number | string,
  data: Record<string, unknown>,
  opts: { locale: Locale; draft: boolean; keepalive?: boolean },
) {
  const q = new URLSearchParams({ locale: opts.locale, depth: '0' })
  if (opts.draft) q.set('draft', 'true')
  return call<{ id: number }>(`/api/${collection}/${id}?${q}`, {
    method: 'PATCH',
    // بيكمّل الطلب حتى لو الصفحة انسكّرت
    keepalive: opts.keepalive,
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

/**
 * على Vercel الطلب للسيرفر ما بيقدر يكون أكبر من 4.5 ميغا — وصورة من الجوال بتكون 3–8 ميغا.
 * (صفحة التعديل الكاملة بترفع لـ Supabase مباشرة، بس البطاقات بترفع عبر السيرفر.)
 * فمنصغّر الصورة هون بالمتصفح قبل الرفع: أطول ضلع 2560px (نفس اللي الموقع بيحفظه أصلاً).
 * صور صغيرة، SVG وGIF بتنرفع زي ما هي.
 */
const SAFE_BYTES = 3.5 * 1024 * 1024
const MAX_SIDE = 2560

export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || /svg|gif/.test(file.type) || file.size <= SAFE_BYTES) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const keepAlpha = file.type === 'image/png' || file.type === 'image/webp'
    const type = keepAlpha ? 'image/webp' : 'image/jpeg'
    for (const [side, quality] of [
      [MAX_SIDE, 0.85],
      [2000, 0.8],
      [1600, 0.75],
    ] as const) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, quality))
      if (blob && blob.size <= SAFE_BYTES) {
        bitmap.close()
        const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg')
        return new File([blob], name, { type })
      }
    }
    bitmap.close()
  } catch {
    // صيغة ما بيعرفها المتصفح (مثلاً HEIC) — منجرّب نرفعها زي ما هي
  }
  return file
}

/** يرفع صورة لمكتبة الصور ويرجّع رقمها ورابطها. الوصف (alt) إجباري بالمكتبة — منحط الاسم. */
export async function uploadMedia(original: File, alt: string, locale: Locale) {
  const file = await shrinkImage(original)
  const form = new FormData()
  form.set('file', file)
  form.set('_payload', JSON.stringify({ alt: alt || file.name }))
  const doc = await call<{ id: number; url?: string; sizes?: Record<string, { url?: string }> }>(`/api/media?locale=${locale}&depth=0`, {
    method: 'POST',
    body: form,
  })
  return { id: doc.id, url: doc.sizes?.card?.url || doc.url || '' }
}
