'use client'

/**
 * «عدّل الموقع» — saving.
 *
 * - Documents with drafts (homepage, courses, groups, news, graduates) are saved right away as a
 *   DRAFT via REST (`?draft=true`, same as the cards view) — the preview shows them, visitors don't.
 * - Documents without drafts (staff, partners, fixed texts, site settings) would go live on save,
 *   so their changes wait here in the browser («overlay») and are written only by «انشر».
 * - Saves of one document run one after the other (never two writes to the same document at once).
 * - Every change keeps what was there before, so «تراجع» can put it back.
 * - The session is kept in this browser (localStorage), so a reload doesn't lose the list.
 */
import { findForbiddenWording, forbiddenWordingMessage } from '@/lib/rules'
import { docOf, isVersioned } from '@/lib/edit-marks'

import { ApiError, call } from '../cards/api'
import { type Doc, type Locale, otherLocale, pick, setAt, topKey } from './ops'

export { ApiError }

const STORAGE_KEY = 'almrkz-edit-site:v1'
/** Changes that can still be undone (older ones keep counting, but can't be undone). */
const UNDO_LIMIT = 40

type Change = {
  id: string
  d: string
  label: string
  at: number
  versioned: boolean
  /** Versioned: the fields as they were before, per language (sent back by «تراجع»). */
  before?: Partial<Record<Locale, Doc>>
  /** Not versioned: the waiting changes of this document before this change. */
  prevOverlay?: Partial<Record<Locale, Doc>>
}

type State = {
  changes: Change[]
  /** Not-versioned documents: field → new value, per language (written by «انشر»). */
  overlay: Record<string, Partial<Record<Locale, Doc>>>
}

export type Applied = { tops: string[]; otherEdits?: Record<string, string> }

const clone = <T,>(v: T): T => (v === undefined ? v : (structuredClone(v) as T))

/** Payload's REST: a collection document is updated with PATCH, a global (page) with POST. */
const writeMethod = (d: string) => ('collection' in docOf(d) ? 'PATCH' : 'POST')

function docUrl(d: string, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString()
  const doc = docOf(d)
  return 'collection' in doc ? `/api/${doc.collection}/${doc.id}?${q}` : `/api/globals/${doc.global}?${q}`
}

/** Message in plain Arabic for a price / job promise (same rules the server checks). */
export function ruleProblem(values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v !== 'string' || !v) continue
    const rule = findForbiddenWording(v)
    if (rule) return forbiddenWordingMessage(rule, v.match(rule.pattern)?.[0] ?? v)
  }
  return null
}

export function explainError(e: unknown): string {
  if (e instanceof ApiError) return e.message
  if (e instanceof Error && /fetch|network/i.test(e.message))
    return 'ما في اتصال بالسيرفر هلأ. تأكد من الإنترنت وجرّب كمان مرة.'
  if (e instanceof Error && e.message) return e.message
  return 'صار خطأ وما انحفظ. جرّب كمان مرة.'
}

export class EditSession {
  private state: State = { changes: [], overlay: {} }
  private chains = new Map<string, Promise<unknown>>()
  private listeners = new Set<() => void>()
  version = 0
  /** Number of saves waiting / running (for «عم يحفظ…»). */
  busy = 0

  constructor() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const s = JSON.parse(raw) as State
        if (Array.isArray(s.changes) && s.overlay && typeof s.overlay === 'object') this.state = s
      }
    } catch {
      // private window / blocked storage: start empty
    }
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    this.version++
    this.persist()
    this.listeners.forEach((fn) => fn())
  }

  private persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // too big: forget the oldest undo snapshots and try once more
      this.state.changes.slice(0, -10).forEach((c) => {
        delete c.before
        delete c.prevOverlay
      })
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
      } catch {
        // storage blocked — the session still works until the page is closed
      }
    }
  }

  get count() {
    return this.state.changes.length
  }

  get canUndo() {
    const last = this.state.changes.at(-1)
    return Boolean(last && (last.versioned ? last.before : last.prevOverlay))
  }

  /** The last change was on a document with drafts (the page is refreshed, not reloaded). */
  get lastVersioned() {
    return this.state.changes.at(-1)?.versioned ?? true
  }

  get lastLabel() {
    return this.state.changes.at(-1)?.label ?? ''
  }

  /** Documents changed in this session (with a readable label). */
  get touched(): { d: string; label: string; versioned: boolean }[] {
    const seen = new Map<string, { d: string; label: string; versioned: boolean }>()
    for (const c of this.state.changes) seen.set(c.d, { d: c.d, label: c.label, versioned: c.versioned })
    return [...seen.values()]
  }

  /** Changes waiting in the browser (documents without drafts), for showing them in the preview. */
  get overlay() {
    return this.state.overlay
  }

  /** One after the other per document. */
  private serial<T>(d: string, run: () => Promise<T>): Promise<T> {
    const prev = this.chains.get(d) ?? Promise.resolve()
    const next = prev.catch(() => undefined).then(run)
    this.chains.set(d, next)
    this.busy++
    this.emit()
    return next.finally(() => {
      this.busy--
      if (this.chains.get(d) === next) this.chains.delete(d)
      this.emit()
    })
  }

  /** The document as the preview shows it (latest draft, + changes waiting here). No fallback language. */
  async fetchDoc(d: string, locale: Locale): Promise<Doc> {
    const versioned = isVersioned(d)
    const params: Record<string, string> = { locale, depth: '0', 'fallback-locale': 'none' }
    if (versioned) params.draft = 'true'
    const doc = await call<Doc>(docUrl(d, params), { method: 'GET', cache: 'no-store' })
    const waiting = versioned ? undefined : this.state.overlay[d]?.[locale]
    return waiting ? { ...doc, ...clone(waiting) } : doc
  }

  /**
   * Saves one change: reads the latest version of the document in both languages, lets `apply`
   * change it (the page's language; `otherEdits` = texts in the other language by path), and
   * writes it as a draft (or keeps it waiting for «انشر»).
   */
  save(d: string, locale: Locale, label: string, apply: (cur: Doc, other: Doc) => Applied): Promise<void> {
    return this.serial(d, async () => {
      const other = otherLocale(locale)
      const [cur, oth] = await Promise.all([this.fetchDoc(d, locale), this.fetchDoc(d, other)])
      const before = { [locale]: clone(cur), [other]: clone(oth) } as Record<Locale, Doc>
      const { tops, otherEdits = {} } = apply(cur, oth)
      const edits = Object.fromEntries(Object.entries(otherEdits).filter(([, v]) => typeof v === 'string'))
      const problem = ruleProblem([...tops.flatMap((k) => collectStrings(cur[k])), ...Object.values(edits)])
      if (problem) throw new ApiError(problem)
      const otherTops = [...new Set(Object.keys(edits).map(topKey))]
      const allTops = [...new Set([...tops, ...otherTops])]
      if (!allTops.length) return
      const versioned = isVersioned(d)
      const change: Change = { id: `${Date.now()}-${Math.random()}`, d, label, at: Date.now(), versioned }
      if (versioned) {
        const body: Doc = pick(cur, tops)
        if (Object.keys(edits).length) body.bilingualEdits = { [other]: edits }
        await call(docUrl(d, { locale, depth: '0', draft: 'true' }), {
          method: writeMethod(d),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        change.before = { [locale]: pick(before[locale], allTops), [other]: pick(before[other], allTops) }
      } else {
        change.prevOverlay = clone(this.state.overlay[d] ?? {})
        const o = (this.state.overlay[d] ??= {})
        o[locale] = { ...o[locale], ...pick(cur, tops) }
        if (otherTops.length) {
          for (const [p, v] of Object.entries(edits)) setAt(oth, p, v)
          o[other] = { ...o[other], ...pick(oth, otherTops) }
        }
      }
      this.state.changes.push(change)
      this.state.changes.slice(0, -UNDO_LIMIT).forEach((c) => {
        delete c.before
        delete c.prevOverlay
      })
      this.emit()
    })
  }

  /** «تراجع»: puts back what was there before the last change. */
  undo(): Promise<string | null> {
    const last = this.state.changes.at(-1)
    if (!last || !this.canUndo) return Promise.resolve(null)
    return this.serial(last.d, async () => {
      if (last.versioned && last.before) {
        for (const [locale, fields] of Object.entries(last.before) as [Locale, Doc][]) {
          await call(docUrl(last.d, { locale, depth: '0', draft: 'true' }), {
            method: writeMethod(last.d),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
          })
        }
      } else {
        if (last.prevOverlay && Object.keys(last.prevOverlay).length) this.state.overlay[last.d] = last.prevOverlay
        else delete this.state.overlay[last.d]
      }
      this.state.changes.pop()
      this.emit()
      return last.label
    })
  }

  /** Writes the changes that were waiting in the browser (documents without drafts). */
  async writeWaiting(): Promise<string[]> {
    const failed: string[] = []
    for (const [d, perLocale] of Object.entries(this.state.overlay)) {
      try {
        await this.serial(d, async () => {
          for (const [locale, fields] of Object.entries(perLocale) as [Locale, Doc][]) {
            if (!fields || !Object.keys(fields).length) continue
            await call(docUrl(d, { locale, depth: '0' }), {
              method: writeMethod(d),
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fields),
            })
          }
        })
        delete this.state.overlay[d]
        this.state.changes = this.state.changes.filter((c) => c.d !== d)
        this.emit()
      } catch (e) {
        const label = this.state.changes.find((c) => c.d === d)?.label ?? d
        failed.push(`«${label}»: ${explainError(e)}`)
      }
    }
    return failed
  }

  /** After «انشر»: these documents are live — they leave the list. */
  published(docs: string[]) {
    const done = new Set(docs)
    this.state.changes = this.state.changes.filter((c) => !done.has(c.d))
    this.emit()
  }

  /** Waits for all running saves. */
  async settle() {
    await Promise.allSettled([...this.chains.values()])
  }
}

function collectStrings(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (Array.isArray(v)) return v.flatMap(collectStrings)
  if (v && typeof v === 'object') return Object.values(v).flatMap(collectStrings)
  return []
}
