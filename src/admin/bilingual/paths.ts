/**
 * عربي وعبري جنب بعض — عناوين الخانات.
 *
 * عنوان الخانة بالفورم زي `sections.2.items.0.question` (بالأرقام). الأرقام بتتغيّر إذا حدا رتّب
 * الصفوف من جديد، فبنحوّلها لرقم الصف الثابت: `sections.#<id>.items.#<id>.question`.
 * الصفوف (array / blocks) مشتركة بين اللغتين — بس النص جوّاها إله نسخة لكل لغة — فنفس الرقم
 * الثابت بيدلّ على نفس الصف بالعبري وبالعربي.
 */

export const LOCALES = ['ar', 'he'] as const
export type Locale = (typeof LOCALES)[number]

/** اسم الخانة المخفية اللي بتحمل تعديلات اللغة الثانية مع الحفظ */
export const EDITS_FIELD = 'bilingualEdits'

/** { he: { 'seo.title': '...', 'sections.#abc.title': '...' } } */
export type Edits = Partial<Record<Locale, Record<string, string>>>

const isRowIndex = (s: string) => /^\d+$/.test(s)

/** `sections.2.title` ← رقم الصف من الفورم → `sections.#<id>.title`. بدون رقم صف: بيرجع null. */
export function toIdPath(path: string, rowId: (prefix: string) => unknown): string | null {
  const parts = path.split('.')
  const out: string[] = []
  for (let i = 0; i < parts.length; i++) {
    if (isRowIndex(parts[i])) {
      const id = rowId(parts.slice(0, i + 1).join('.'))
      if (typeof id !== 'string' && typeof id !== 'number') return null
      out.push(`#${id}`)
    } else out.push(parts[i])
  }
  return out.join('.')
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

function step(node: unknown, seg: string): unknown {
  if (seg.startsWith('#')) {
    const id = seg.slice(1)
    return Array.isArray(node) ? node.find((r) => isObj(r) && String(r.id) === id) : undefined
  }
  return isObj(node) ? node[seg] : undefined
}

export function getAt(doc: unknown, idPath: string): unknown {
  return idPath.split('.').reduce<unknown>((node, seg) => step(node, seg), doc)
}

/** بيكتب القيمة بمكانها. إذا الصف مش موجود (انحذف) بيرجع false وما بيعمل إشي. */
export function setAt(doc: Obj, idPath: string, value: unknown): boolean {
  const parts = idPath.split('.')
  let node: unknown = doc
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i]
    let next = step(node, seg)
    if (next == null && !seg.startsWith('#') && isObj(node) && !parts[i + 1].startsWith('#')) {
      next = node[seg] = {}
    }
    if (!isObj(next) && !Array.isArray(next)) return false
    node = next
  }
  const last = parts[parts.length - 1]
  if (!isObj(node) || last.startsWith('#')) return false
  node[last] = value
  return true
}
