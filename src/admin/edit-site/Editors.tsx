'use client'

import { useUploadHandlers } from '@payloadcms/ui'
import React, { useEffect, useRef, useState } from 'react'

import { type EditMark, type FieldSpec, formHref, isVersioned, joinPath, rowOf } from '@/lib/edit-marks'

import { type MediaDoc, getMedia, isVideo, listMedia, thumbOf, uploadMedia } from './media'
import {
  type Doc,
  type Locale,
  duplicateRow,
  getAt,
  moveRow,
  otherLocale,
  relId,
  removeRow,
  rowTexts,
  setAt,
  topKey,
} from './ops'
import { ApiError, type EditSession, explainError, ruleProblem } from './session'

export const LANG_NAME: Record<Locale, string> = { ar: 'عربي', he: 'עברית' }

/** What the editor needs to know after a save. */
export type AfterSave = { changed?: { old: string; value: string }; openAfter?: { d: string; p: string } }

type Common = {
  mark: EditMark
  locale: Locale
  session: EditSession
  onClose: () => void
  onSaved: (after: AfterSave, mark: EditMark) => void
}

const asText = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

/** Loads the document in both languages (latest draft). */
function useDocs(session: EditSession, d: string, locale: Locale) {
  const [docs, setDocs] = useState<{ cur: Doc; oth: Doc } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    Promise.all([session.fetchDoc(d, locale), session.fetchDoc(d, otherLocale(locale))])
      .then(([cur, oth]) => live && setDocs({ cur, oth }))
      .catch((e) => live && setError(explainError(e)))
    return () => {
      live = false
    }
  }, [session, d, locale])
  return { docs, error }
}

/** «⬆ قبل / ⬇ بعد / ＋ نسخة / 🗑 احذف» for an item of a list (reels, questions, points…). */
function RowActions({ mark, locale, session, onSaved, onClose, setError, busy, setBusy }: Common & {
  setError: (s: string) => void
  busy: boolean
  setBusy: (b: boolean) => void
}) {
  const row = rowOf(mark.p)
  if (!row) return null
  const run = async (action: 'up' | 'down' | 'dup' | 'del') => {
    if (action === 'del' && !window.confirm('أكيد بدك تحذف هاد العنصر من القائمة؟ (بتقدر ترجّعه بزر «تراجع»)')) return
    setBusy(true)
    setError('')
    let openAfter: AfterSave['openAfter']
    try {
      await session.save(mark.d, locale, `${actionName[action]}: ${mark.l}`, (cur, oth) => {
        const top = topKey(row.list)
        if (action === 'up' || action === 'down') {
          if (!moveRow(cur, row.list, row.row, action === 'up' ? -1 : 1))
            throw new ApiError(action === 'up' ? 'هاد أول واحد بالقائمة.' : 'هاد آخر واحد بالقائمة.')
          return { tops: [top] }
        }
        if (action === 'del') {
          if (!removeRow(cur, row.list, row.row)) throw new ApiError('ما لقيناه — يمكن انحذف من قبل.')
          return { tops: [top] }
        }
        const newId = duplicateRow(cur, row.list, row.row)
        if (!newId) throw new ApiError('ما لقيناه — يمكن انحذف من قبل.')
        openAfter = { d: mark.d, p: mark.p.replace(`#${row.row}`, `#${newId}`) }
        return { tops: [top], otherEdits: rowTexts(getAt(oth, `${row.list}.#${row.row}`), `${row.list}.#${newId}`) }
      })
      onSaved({ openAfter }, mark)
      onClose()
    } catch (e) {
      setError(explainError(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="es-rowbar" role="group" aria-label="ترتيب القائمة">
      <button type="button" disabled={busy} onClick={() => run('up')} title="حرّكه لقدّام (قبل اللي قبله)">
        ⬆ قبل
      </button>
      <button type="button" disabled={busy} onClick={() => run('down')} title="حرّكه لورا (بعد اللي بعده)">
        ⬇ بعد
      </button>
      <button type="button" disabled={busy} onClick={() => run('dup')} title="بيعمل نسخة جديدة بعده — بعدين غيّر فيها">
        ＋ زيد واحد جديد
      </button>
      <button type="button" disabled={busy} className="es-danger" onClick={() => run('del')}>
        🗑 احذف
      </button>
    </div>
  )
}

const actionName = { up: 'ترتيب', down: 'ترتيب', dup: 'إضافة', del: 'حذف' } as const

function Footer({ mark }: { mark: EditMark }) {
  return (
    <p className="es-foot">
      {isVersioned(mark.d) ? 'بينحفظ كمسودة — الزوار ما بيشوفوه لحد ما تكبس «انشر».' : 'بيستنّى هون لحد ما تكبس «انشر» — الزوار ما بيشوفوه قبل.'}{' '}
      <a href={formHref(mark.d)} target="_blank" rel="noopener">
        الفورم الكامل ↗
      </a>
    </p>
  )
}

/* ───────────────────────── text in place ───────────────────────── */

export function TextEditor(props: Common & { style: React.CSSProperties }) {
  const { mark, locale, session, onClose, onSaved, style } = props
  const { docs, error: loadError } = useDocs(session, mark.d, locale)
  const [value, setValue] = useState<string | null>(null)
  const [other, setOther] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const first = useRef<HTMLTextAreaElement>(null)
  const oth = otherLocale(locale)
  const original = docs ? asText(getAt(docs.cur, mark.p)) : ''
  const originalOther = docs ? asText(getAt(docs.oth, mark.p)) : ''
  const v = value ?? original
  const o = other ?? originalOther

  useEffect(() => {
    if (docs) first.current?.focus()
  }, [docs])

  const save = async () => {
    if (!docs || busy) return
    if (v === original && o === originalOther) return onClose()
    const problem = ruleProblem([v, o])
    if (problem) return setError(problem)
    setBusy(true)
    setError('')
    try {
      await session.save(mark.d, locale, mark.l, (cur) => {
        const tops: string[] = []
        if (v !== original) {
          if (!setAt(cur, mark.p, v)) throw new ApiError('هاد المكان انحذف أو تغيّر — حدّث الصفحة وجرّب كمان مرة.')
          tops.push(topKey(mark.p))
        }
        return { tops, otherEdits: o !== originalOther ? { [mark.p]: o } : undefined }
      })
      onSaved({ changed: v !== original ? { old: original, value: v } : undefined }, mark)
      onClose()
    } catch (e) {
      setError(explainError(e))
    } finally {
      setBusy(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || (mark.k === 'text' && !e.shiftKey))) {
      e.preventDefault()
      void save()
    }
  }

  return (
    <div className="es-pop" style={style} role="dialog" aria-label={mark.l} onKeyDown={onKey}>
      <div className="es-pop__head">
        <b>{mark.l}</b>
        <button type="button" className="es-x" onClick={onClose} aria-label="سكّر">
          ✕
        </button>
      </div>
      {!docs && !loadError && <p className="es-muted">عم يحمّل…</p>}
      {loadError && <p className="es-error">{loadError}</p>}
      {docs && (
        <>
          <label className="es-field">
            <span>
              {LANG_NAME[locale]} <small>(هاي الصفحة)</small>
            </span>
            <textarea
              ref={first}
              dir="rtl"
              rows={mark.k === 'textarea' ? 4 : 2}
              value={v}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <label className="es-field es-field--other">
            <span>
              {LANG_NAME[oth]} <small>(نفس المكان بالصفحة ال{oth === 'he' ? 'عبرية' : 'عربية'})</small>
            </span>
            <textarea dir="rtl" rows={mark.k === 'textarea' ? 3 : 1} value={o} onChange={(e) => setOther(e.target.value)} />
          </label>
          {error && (
            <p className="es-error" role="alert">
              {error}
            </p>
          )}
          <div className="es-actions">
            <button type="button" className="es-btn es-btn--primary" disabled={busy} onClick={save}>
              {busy ? 'عم يحفظ…' : 'احفظ'}
            </button>
            <button type="button" className="es-btn" disabled={busy} onClick={onClose}>
              إلغاء
            </button>
          </div>
          <RowActions {...props} setError={setError} busy={busy} setBusy={setBusy} />
          <Footer mark={mark} />
        </>
      )}
    </div>
  )
}

/* ───────────────────────── «open the full form» ───────────────────────── */

export function FormOnly({ mark, onClose, style }: { mark: EditMark; onClose: () => void; style: React.CSSProperties }) {
  return (
    <div className="es-pop" style={style} role="dialog" aria-label={mark.l} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="es-pop__head">
        <b>{mark.l}</b>
        <button type="button" className="es-x" onClick={onClose} aria-label="سكّر">
          ✕
        </button>
      </div>
      <p>هاد الجزء فيه تنسيق (عناوين، قوائم…) أو صور كثيرة، فبينعدّل من الفورم الكامل.</p>
      <div className="es-actions">
        <a className="es-btn es-btn--primary" href={formHref(mark.d)} target="_blank" rel="noopener">
          افتح الفورم ↗
        </a>
        <button type="button" className="es-btn" onClick={onClose}>
          سكّر
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────── dialog: pictures, videos, several fields ───────────────────────── */

type Val = { v: unknown; o?: string }

export function FieldsDialog(props: Common) {
  const { mark, locale, session, onClose, onSaved } = props
  const specs = mark.f ?? []
  const { docs, error: loadError } = useDocs(session, mark.d, locale)
  const [vals, setVals] = useState<Record<string, Val>>({})
  const [media, setMedia] = useState<Record<string, MediaDoc | null>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [picker, setPicker] = useState<{ name: string; kind: 'image' | 'video' } | null>(null)
  const [courses, setCourses] = useState<{ id: number; name: string }[] | null>(null)
  const { getUploadHandler } = useUploadHandlers()
  const oth = otherLocale(locale)

  const path = (name: string) => joinPath(mark.p, name)
  const initial = (name: string): Val =>
    docs ? { v: getAt(docs.cur, path(name)) ?? null, o: asText(getAt(docs.oth, path(name))) } : { v: null }
  const val = (name: string) => vals[name] ?? initial(name)

  // previews of the current files
  useEffect(() => {
    if (!docs) return
    for (const [name, type] of specs) {
      if (type !== 'image' && type !== 'video') continue
      const id = relId(getAt(docs.cur, joinPath(mark.p, name)))
      void getMedia(id).then((m) => setMedia((x) => (name in x ? x : { ...x, [name]: m })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per loaded document
  }, [docs])

  useEffect(() => {
    if (!specs.some(([, t]) => t === 'course')) return
    const q = new URLSearchParams({ limit: '200', depth: '0', locale, draft: 'true', sort: 'order', 'select[name]': 'true' })
    fetch(`/api/courses?${q}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { docs?: { id: number; name: string }[] }) => setCourses(j.docs ?? []))
      .catch(() => setCourses([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, [])

  const set = (name: string, patch: Partial<Val>) => setVals((x) => ({ ...x, [name]: { ...val(name), ...patch } }))

  const onFile = async (name: string, kind: 'image' | 'video', file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith(`${kind}/`)) {
      setError(kind === 'video' ? 'هاد مش ملف فيديو. اختار ملف MP4.' : 'هاد مش ملف صورة. اختار صورة (JPG، PNG، WEBP).')
      return
    }
    setError('')
    setUploading(name)
    try {
      // الوصف (alt) إجباري بالمكتبة: منحط شو هاد ووين («صورة الغلاف — فيديو — ريل: لحّام»)
      const label = specs.find(([n]) => n === name)?.[2] ?? ''
      const alt = specs.length > 1 && label ? `${label} — ${mark.l}` : mark.l
      const doc = await uploadMedia(file, alt.slice(0, 200) || file.name, getUploadHandler({ collectionSlug: 'media' }) as never)
      set(name, { v: doc.id })
      setMedia((x) => ({ ...x, [name]: doc }))
    } catch (e) {
      setError(explainError(e))
    } finally {
      setUploading(null)
    }
  }

  const save = async () => {
    if (!docs || busy || uploading) return
    const changed = specs.filter(([name, type]) => {
      const a = val(name)
      const b = initial(name)
      if (type === 'image' || type === 'video' || type === 'course') return relId(a.v) !== relId(b.v)
      if (type === 'text' || type === 'textarea') return asText(a.v) !== asText(b.v) || a.o !== b.o
      return asText(a.v) !== asText(b.v)
    })
    if (!changed.length) return onClose()
    const problem = ruleProblem(changed.flatMap(([name]) => [val(name).v, val(name).o]))
    if (problem) return setError(problem)
    setBusy(true)
    setError('')
    try {
      await session.save(mark.d, locale, mark.l, (cur) => {
        const tops = new Set<string>()
        const otherEdits: Record<string, string> = {}
        for (const [name, type] of changed) {
          const p = path(name)
          const a = val(name)
          const b = initial(name)
          let next: unknown = a.v
          if (type === 'number') next = asText(a.v).trim() === '' ? null : Number(a.v)
          if (type === 'image' || type === 'video' || type === 'course') next = relId(a.v)
          if (type === 'plain' || type === 'text' || type === 'textarea') next = asText(a.v)
          const same = type === 'text' || type === 'textarea' ? asText(a.v) === asText(b.v) : false
          if (!same) {
            if (!setAt(cur, p, next)) throw new ApiError('هاد المكان انحذف أو تغيّر — حدّث الصفحة وجرّب كمان مرة.')
            tops.add(topKey(p))
          }
          if ((type === 'text' || type === 'textarea') && a.o !== b.o) otherEdits[p] = a.o ?? ''
        }
        return { tops: [...tops], otherEdits }
      })
      onSaved({}, mark)
      onClose()
    } catch (e) {
      setError(explainError(e))
    } finally {
      setBusy(false)
    }
  }

  const numberBad = specs.some(([name, type]) => type === 'number' && asText(val(name).v).trim() !== '' && Number.isNaN(Number(val(name).v)))

  return (
    <div className="es-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="es-dialog" role="dialog" aria-label={mark.l} onKeyDown={(e) => e.key === 'Escape' && !picker && onClose()}>
        <div className="es-pop__head">
          <b>{mark.l}</b>
          <button type="button" className="es-x" onClick={onClose} aria-label="سكّر">
            ✕
          </button>
        </div>
        {!docs && !loadError && <p className="es-muted">عم يحمّل…</p>}
        {loadError && <p className="es-error">{loadError}</p>}
        {docs && (
          <div className="es-fields">
            {specs.map((spec) => (
              <FieldRow
                key={spec[0]}
                spec={spec}
                locale={locale}
                oth={oth}
                value={val(spec[0])}
                media={media[spec[0]]}
                uploading={uploading === spec[0]}
                courses={courses}
                onChange={(patch) => set(spec[0], patch)}
                onClear={() => {
                  set(spec[0], { v: null })
                  setMedia((x) => ({ ...x, [spec[0]]: null }))
                }}
                onFile={(f) => onFile(spec[0], spec[1] as 'image' | 'video', f)}
                onPick={() => setPicker({ name: spec[0], kind: spec[1] as 'image' | 'video' })}
              />
            ))}
          </div>
        )}
        {numberBad && <p className="es-error">الرقم لازم يكون أرقام بس (مثلاً 15).</p>}
        {error && (
          <p className="es-error" role="alert">
            {error}
          </p>
        )}
        {docs && (
          <>
            <div className="es-actions">
              <button type="button" className="es-btn es-btn--primary" disabled={busy || !!uploading || numberBad} onClick={save}>
                {busy ? 'عم يحفظ…' : uploading ? 'استنّى الرفع…' : 'احفظ'}
              </button>
              <button type="button" className="es-btn" disabled={busy} onClick={onClose}>
                إلغاء
              </button>
            </div>
            <RowActions {...props} setError={setError} busy={busy} setBusy={setBusy} />
            <Footer mark={mark} />
          </>
        )}
        {picker && (
          <MediaPicker
            kind={picker.kind}
            onClose={() => setPicker(null)}
            onPick={(m) => {
              set(picker.name, { v: m.id })
              setMedia((x) => ({ ...x, [picker.name]: m }))
              setPicker(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function FieldRow({
  spec: [, type, label],
  locale,
  oth,
  value,
  media,
  uploading,
  courses,
  onChange,
  onClear,
  onFile,
  onPick,
}: {
  spec: FieldSpec
  locale: Locale
  oth: Locale
  value: Val
  media: MediaDoc | null | undefined
  uploading: boolean
  courses: { id: number; name: string }[] | null
  onChange: (patch: Partial<Val>) => void
  onClear: () => void
  onFile: (f: File | undefined) => void
  onPick: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  if (type === 'image' || type === 'video') {
    const id = relId(value.v)
    return (
      <div className="es-media">
        <span className="es-label">{label}</span>
        <div className="es-media__row">
          <div className="es-media__preview">
            {uploading ? (
              <span className="es-muted">عم يرفع… {type === 'video' ? '(الفيديو ممكن ياخد دقيقة)' : ''}</span>
            ) : id && media ? (
              isVideo(media) ? (
                <video src={media.url ?? undefined} muted playsInline controls preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbOf(media)} alt="" />
              )
            ) : id ? (
              <span className="es-muted">عم يحمّل…</span>
            ) : (
              <span className="es-muted">{type === 'video' ? 'ما في فيديو' : 'ما في صورة'}</span>
            )}
          </div>
          <div className="es-media__btns">
            <input
              ref={fileInput}
              type="file"
              hidden
              accept={type === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
              onChange={(e) => {
                onFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button type="button" className="es-btn es-btn--primary" disabled={uploading} onClick={() => fileInput.current?.click()}>
              ⬆ ارفع ملف جديد
            </button>
            <button type="button" className="es-btn" disabled={uploading} onClick={onPick}>
              🗂 اختر من المكتبة
            </button>
            {id ? (
              <button type="button" className="es-btn es-btn--quiet" disabled={uploading} onClick={onClear}>
                شيل
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
  if (type === 'course') {
    return (
      <label className="es-field">
        <span>{label}</span>
        <select value={relId(value.v) ?? ''} onChange={(e) => onChange({ v: e.target.value ? Number(e.target.value) : null })}>
          <option value="">— بدون دورة —</option>
          {(courses ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    )
  }
  if (type === 'text' || type === 'textarea') {
    return (
      <div className="es-pair">
        <label className="es-field">
          <span>
            {label} — {LANG_NAME[locale]}
          </span>
          <textarea dir="rtl" rows={type === 'textarea' ? 3 : 1} value={asText(value.v)} onChange={(e) => onChange({ v: e.target.value })} />
        </label>
        <label className="es-field es-field--other">
          <span>{LANG_NAME[oth]}</span>
          <textarea dir="rtl" rows={type === 'textarea' ? 3 : 1} value={value.o ?? ''} onChange={(e) => onChange({ o: e.target.value })} />
        </label>
      </div>
    )
  }
  return (
    <label className="es-field">
      <span>{label}</span>
      <input
        dir={type === 'number' ? 'ltr' : 'auto'}
        inputMode={type === 'number' ? 'numeric' : undefined}
        value={asText(value.v)}
        onChange={(e) => onChange({ v: e.target.value })}
      />
    </label>
  )
}

function MediaPicker({ kind, onClose, onPick }: { kind: 'image' | 'video'; onClose: () => void; onPick: (m: MediaDoc) => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<MediaDoc[] | null>(null)
  const [more, setMore] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    const t = setTimeout(() => {
      listMedia(kind, search, page)
        .then((r) => {
          if (!live) return
          setItems((x) => (page === 1 ? r.docs : [...(x ?? []), ...r.docs]))
          setMore(Boolean(r.hasNextPage))
        })
        .catch((e) => live && setError(explainError(e)))
    }, 250)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [kind, search, page])
  return (
    <div className="es-picker" role="dialog" aria-label="اختر من المكتبة" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="es-pop__head">
        <b>{kind === 'video' ? 'اختر فيديو من المكتبة' : 'اختر صورة من المكتبة'}</b>
        <button type="button" className="es-x" onClick={onClose} aria-label="سكّر">
          ✕
        </button>
      </div>
      <input
        className="es-search"
        placeholder="دوّر بالاسم أو الوصف…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
      />
      {error && <p className="es-error">{error}</p>}
      {!items && !error && <p className="es-muted">عم يحمّل…</p>}
      {items && !items.length && <p className="es-muted">ما لقينا إشي.</p>}
      <div className="es-grid">
        {(items ?? []).map((m) => (
          <button key={m.id} type="button" className="es-grid__item" onClick={() => onPick(m)} title={m.alt || m.filename || ''}>
            {isVideo(m) ? (
              <video src={m.url ?? undefined} muted playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbOf(m)} alt="" loading="lazy" />
            )}
            <small>{m.alt || m.filename}</small>
          </button>
        ))}
      </div>
      {more && (
        <button type="button" className="es-btn" onClick={() => setPage((p) => p + 1)}>
          ورجيني أكثر
        </button>
      )}
    </div>
  )
}
