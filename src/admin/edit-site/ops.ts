/**
 * «عدّل الموقع» — pure helpers that change a document in memory before it is saved.
 * Paths use fixed row ids (`sections.#<id>.reels.#<id>.title`, see admin/bilingual/paths.ts),
 * so a list that someone reordered in the meantime still gets the change in the right row.
 */
import { getAt, setAt } from '../bilingual/paths'

export type Doc = Record<string, unknown>
export type Locale = 'ar' | 'he'

export const otherLocale = (l: Locale): Locale => (l === 'ar' ? 'he' : 'ar')

/** First part of a path = the field that is sent to the server («sections», «quote»). */
export const topKey = (path: string) => path.split('.')[0]

export { getAt, setAt }

const rows = (doc: Doc, list: string): Doc[] | null => {
  const v = getAt(doc, list)
  return Array.isArray(v) ? (v as Doc[]) : null
}

/** Moves a row one place up (-1) or down (+1). False if it can't move. */
export function moveRow(doc: Doc, list: string, rowId: string, dir: -1 | 1): boolean {
  const arr = rows(doc, list)
  if (!arr) return false
  const i = arr.findIndex((r) => String(r.id) === rowId)
  const j = i + dir
  if (i < 0 || j < 0 || j >= arr.length) return false
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  return true
}

export function removeRow(doc: Doc, list: string, rowId: string): boolean {
  const arr = rows(doc, list)
  if (!arr) return false
  const i = arr.findIndex((r) => String(r.id) === rowId)
  if (i < 0) return false
  arr.splice(i, 1)
  return true
}

/** New row id in Payload's format (24 hex characters, like a Mongo ObjectId). */
export function newRowId(): string {
  const hex = (n: number) => Math.floor(n).toString(16).padStart(8, '0')
  let rest = ''
  for (let i = 0; i < 16; i++) rest += Math.floor(Math.random() * 16).toString(16)
  return hex(Date.now() / 1000).slice(-8) + rest
}

/** Gives every row inside `value` (nested lists) a new id. */
function freshIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(freshIds)
  if (value && typeof value === 'object') {
    const out: Doc = {}
    for (const [k, v] of Object.entries(value)) out[k] = k === 'id' ? newRowId() : freshIds(v)
    return out
  }
  return value
}

/**
 * Copies a row and puts the copy right after it (same texts, same pictures) — the owner then
 * changes what's different. Returns the id of the copy, or null.
 */
export function duplicateRow(doc: Doc, list: string, rowId: string, newId = newRowId()): string | null {
  const arr = rows(doc, list)
  if (!arr) return null
  const i = arr.findIndex((r) => String(r.id) === rowId)
  if (i < 0) return null
  const copy = freshIds(structuredClone(arr[i])) as Doc
  copy.id = newId
  arr.splice(i + 1, 0, copy)
  return newId
}

/**
 * The texts of a row in the other language, as `path → text` for `bilingualEdits`
 * (the copy of a row gets the Hebrew/Arabic texts of the original too).
 */
export function rowTexts(row: unknown, prefix: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!row || typeof row !== 'object' || Array.isArray(row)) return out
  for (const [k, v] of Object.entries(row)) {
    if (k === 'id' || k === 'blockType' || k === 'blockName') continue
    if (typeof v === 'string' && v) out[`${prefix}.${k}`] = v
  }
  return out
}

/** Only the fields that are sent: `{ sections: [...] }`. */
export const pick = (doc: Doc, keys: string[]): Doc => Object.fromEntries(keys.map((k) => [k, doc[k] ?? null]))

/** Id of an upload / relationship value (number, or a populated document). */
export const relId = (v: unknown): number | null =>
  typeof v === 'number' ? v : v && typeof v === 'object' && 'id' in v ? Number((v as { id: unknown }).id) : null
