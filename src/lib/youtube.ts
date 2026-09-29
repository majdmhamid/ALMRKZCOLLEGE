/**
 * YouTube links in the admin (courses, gallery, «فيديو الكلية»). One place that understands them,
 * used by the website (to play the video) and by the admin (to refuse a link it can't play —
 * before, a wrong link was saved and the video silently never appeared on the site).
 */
export const youtubeId = (url?: string | null) =>
  url?.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1] ?? undefined

/** Payload `validate` for a «رابط يوتيوب» text field (empty is fine — it's optional). */
export const validateYoutubeUrl = (value: string | null | undefined): true | string => {
  const v = String(value ?? '').trim()
  if (!v || youtubeId(v)) return true
  return 'هاد مش رابط فيديو يوتيوب. افتح الفيديو بيوتيوب ← «مشاركة» ← «نسخ»، والصق الرابط هون (مثل: https://youtu.be/c3PP4-TM3Y0).'
}
