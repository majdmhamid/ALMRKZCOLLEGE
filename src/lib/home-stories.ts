/**
 * قصص النجاح بالصفحة الرئيسية — قاعدة وحدة بس:
 * القصة بتطلع إذا هي **منشورة** وعليها «اعرضها بالرئيسية» (featured)، بترتيب خانة «الترتيب».
 * (زمان كان في كمان اختيار يدوي بقسم الرئيسية + شرط «لازم اقتباس» — انشالوا 2026-09-30.)
 */

type StoryLike = {
  featured?: boolean | null
  order?: number | null
  quote?: string | null
  excerpt?: string | null
}

/** القصص اللي بتطلع بالرئيسية، بالترتيب (الرقم الأصغر أول) */
export function homeStories<T extends StoryLike>(stories: T[]): T[] {
  return stories
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => Boolean(s.featured))
    .sort((a, b) => (a.s.order ?? 0) - (b.s.order ?? 0) || a.i - b.i)
    .map(({ s }) => s)
}

/**
 * نص القصة: الاقتباس (بين «») و«القصة باختصار» — كل واحد إذا موجود. قصة بدون اقتباس بتطلع
 * بـ«القصة باختصار» بس، وبدون الاثنين بتطلع بالصورة والاسم والدورة — ما بتختفي.
 */
export function storyText(s: StoryLike): { quote: string | null; body: string | null } {
  return { quote: s.quote?.trim() || null, body: s.excerpt?.trim() || null }
}

/** حالة القصة بالرئيسية كما بتنعرض على بطاقتها باللوحة */
export type HomeState = 'shown' | 'hidden' | 'willShow' | 'willHide'

/**
 * @param flag «اعرضها بالرئيسية» بآخر نسخة (المسودة إذا في)
 * @param live نفس الخانة بالنسخة المنشورة (اللي على الموقع هلأ) — false إذا ما انتشرت أبداً
 */
export function homeState(flag: boolean, live: boolean): HomeState {
  if (flag) return live ? 'shown' : 'willShow'
  return live ? 'willHide' : 'hidden'
}

/** أرقام القصص المختارة بالإيد بقسم «قصص نجاح» القديم بالرئيسية (للنقل لمرة وحدة) */
export function storiesChosenOnHomepage(sections: unknown): number[] {
  const ids: number[] = []
  if (!Array.isArray(sections)) return ids
  for (const s of sections as { blockType?: string; stories?: unknown }[]) {
    if (s?.blockType !== 'successStories' || !Array.isArray(s.stories)) continue
    for (const r of s.stories) {
      const id = typeof r === 'number' ? r : r && typeof r === 'object' ? (r as { id?: unknown }).id : undefined
      if (typeof id === 'number' && !ids.includes(id)) ids.push(id)
    }
  }
  return ids
}

export const FEATURED_NEEDS_PHOTO =
  'عشان القصة تطلع بالصفحة الرئيسية لازم صورة للخريج/ة — ضيف صورة، أو شيل «اعرضها بالرئيسية».'

/** `req.context` flag: the one-time move of the old hand-picked stories (seed) skips the photo rule */
export const SKIP_PHOTO_RULE = 'homeStoriesMove'

/** قصة معروضة بالرئيسية بدها صورة (القسم مبني على الصورة الكبيرة) */
export function validateFeatured(
  value: boolean | null | undefined,
  {
    siblingData,
    req,
  }: { siblingData?: { photo?: unknown }; req?: { context?: Record<string, unknown> } },
): true | string {
  if (value && !siblingData?.photo && !req?.context?.[SKIP_PHOTO_RULE]) return FEATURED_NEEDS_PHOTO
  return true
}
