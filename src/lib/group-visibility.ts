/**
 * When does a course group («مجال») appear on the website?
 * ONE rule, used by the website (components/site/data.ts → loadShared) and by the admin panel
 * (the group cards, the group edit page, the homepage «مجالات التأهيل» section), so the admin
 * always says exactly what the site does:
 *   - the group itself is published, AND
 *   - at least one PUBLISHED course belongs to it (an empty group would lead to an empty page).
 * Shared by server and browser code — keep it free of server-only imports.
 */
export type GroupState = 'visible' | 'noCourses' | 'draft'

export function groupState(
  status: string | null | undefined,
  hasPublishedCourse: boolean,
): GroupState {
  if (status !== 'published') return 'draft'
  return hasPublishedCourse ? 'visible' : 'noCourses'
}

/** Id of a relationship value (populated document or bare id). */
export const relationId = (v: unknown): number | undefined => {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'number')
    return (v as { id: number }).id
  return undefined
}

/** Groups that have at least one published course (from the published courses). */
export const groupsWithPublishedCourses = (
  courses: { group?: unknown; _status?: string | null }[],
): Set<number> =>
  new Set(
    courses
      .filter((c) => c._status === 'published')
      .map((c) => relationId(c.group))
      .filter((id): id is number => id !== undefined),
  )

type Lang = 'ar' | 'he'

/** Texts for the admin panel (its language: Arabic, or Hebrew in the user settings). */
export const GROUP_STATE_TEXT: Record<Lang, Record<GroupState, string> & Record<'hint' | 'savedNoCourses' | 'draftHint', string>> = {
  ar: {
    visible: 'ظاهر بالموقع',
    noCourses: 'مخفي: ما فيه دورات منشورة',
    draft: 'مخفي: مسودة',
    hint: 'المجال بيظهر بالموقع بس إذا هو منشور وفيه دورة منشورة وحدة على الأقل. الدورة بتنضاف للمجال من صفحة الدورة (خانة «المجال»).',
    savedNoCourses: 'المجال انحفظ، بس رح يبين بالموقع لما تضيف إله دورة منشورة.',
    draftHint: 'اضغط «نشر التّغييرات» لينتشر.',
  },
  he: {
    visible: 'מוצג באתר',
    noCourses: 'מוסתר: אין בו קורסים מפורסמים',
    draft: 'מוסתר: טיוטה',
    hint: 'התחום מוצג באתר רק אם הוא מפורסם ויש בו לפחות קורס מפורסם אחד. מוסיפים קורס לתחום מדף הקורס (השדה «התחום»).',
    savedNoCourses: 'התחום נשמר, אבל יופיע באתר רק אחרי שתוסיפו לו קורס מפורסם.',
    draftHint: 'לחצו «פרסם שינויים» כדי לפרסם.',
  },
}

export const groupStateText = (lang: string | undefined) => GROUP_STATE_TEXT[lang === 'he' ? 'he' : 'ar']
