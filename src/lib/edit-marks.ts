/**
 * «عدّل الموقع» (src/admin/edit-site): the website marks every editable element with a
 * `data-edit` attribute saying which document and which field it comes from.
 * The marks are only written in preview (draft) mode — see components/site/edit-marks.ts —
 * so the public pages are exactly the same as before.
 *
 * Shared by the website (writes the marks) and the admin panel (reads them).
 */

export const EDIT_ATTR = 'data-edit'

/** Documents that have drafts: a change is saved as a draft until «انشر». */
export const VERSIONED_DOCS = new Set(['homepage', 'courses', 'course-groups', 'news', 'success-stories'])

/**
 * One field inside an edit dialog: [name (relative to the mark's path), type, Arabic label].
 * - text / textarea: a text with an Arabic and a Hebrew version
 * - plain: one text for both languages (duration «0:20», a YouTube link, a year)
 * - number, image, video, course (link to a course)
 */
export type FieldType = 'text' | 'textarea' | 'plain' | 'number' | 'image' | 'video' | 'course'
export type FieldSpec = [name: string, type: FieldType, label: string]

export type EditMark = {
  /** Document: a global slug («homepage») or «collection/id» («success-stories/12»). */
  d: string
  /**
   * Field path. Rows of a list are addressed by their fixed row id, not their position:
   * `sections.#<blockId>.reels.#<rowId>.title` (same scheme as admin/bilingual/paths.ts).
   */
  p: string
  /** text / textarea = edit in place; fields = dialog with the `f` fields; form = open the full form */
  k: 'text' | 'textarea' | 'fields' | 'form'
  /** What it is and where, in Arabic («العنوان — فيديو الكلية») — shown on the hover chip. */
  l: string
  f?: FieldSpec[]
}

export const docOf = (d: string): { collection: string; id: string } | { global: string } => {
  const [slug, id] = d.split('/')
  return id ? { collection: slug, id } : { global: slug }
}

/** Where the full form for this document is in /admin. */
export const formHref = (d: string) => {
  const doc = docOf(d)
  return 'collection' in doc ? `/admin/collections/${doc.collection}/${doc.id}` : `/admin/globals/${doc.global}`
}

export const isVersioned = (d: string) => VERSIONED_DOCS.has(d.split('/')[0])

export const joinPath = (base: string, name: string) => (base && name ? `${base}.${name}` : base || name)

export function readMark(value: string | null | undefined): EditMark | null {
  if (!value) return null
  try {
    const m = JSON.parse(value) as EditMark
    return m && typeof m.d === 'string' && typeof m.p === 'string' && typeof m.k === 'string' ? m : null
  } catch {
    return null
  }
}

/**
 * The list row a path belongs to (for «زيد / احذف / رتّب»):
 * `sections.#a.reels.#b.title` → { list: 'sections.#a.reels', row: 'b' }.
 * The homepage sections themselves are not moved or deleted from here.
 */
export function rowOf(path: string): { list: string; row: string } | null {
  const parts = path.split('.')
  for (let i = parts.length - 1; i > 0; i--) {
    if (parts[i].startsWith('#')) {
      const list = parts.slice(0, i).join('.')
      if (list === 'sections') return null
      return { list, row: parts[i].slice(1) }
    }
  }
  return null
}
