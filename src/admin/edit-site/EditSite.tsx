'use client'

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { EDIT_ATTR, type EditMark, formHref, isVersioned, joinPath, readMark } from '@/lib/edit-marks'

import { type PendingDoc, listPending, publishDocs } from './actions'
import { type AfterSave, FieldsDialog, FormOnly, LANG_NAME, TextEditor } from './Editors'
import { getMedia, thumbOf } from './media'
import { type Locale, getAt, relId, topKey } from './ops'
import { EditSession, explainError } from './session'

export type PageOption = { path: string; label: string; group: string }

/** Opening the page through /next/preview turns preview (draft) mode on for this browser. */
const previewSrc = (locale: Locale, path: string) => `/next/preview?path=${encodeURIComponent(`/${locale}${path}`)}`

/** Added inside the site page (only in this editor). */
const FRAME_CSS = `
html[data-edit-mode] [${EDIT_ATTR}] { cursor: pointer !important; }
html[data-edit-mode].es-show-all [${EDIT_ATTR}] { outline: 1.5px dashed rgba(21, 137, 66, .6); outline-offset: 2px; }
html[data-edit-mode] .preview-banner { display: none !important; }
`

type Active = { el: Element; mark: EditMark }
type Toast = { kind: 'ok' | 'err' | 'info'; text: string }

const noop = () => () => undefined

/** Text pieces of an element (not the screen-reader-only ones). */
function textNodes(el: Element): Text[] {
  const out: Text[] = []
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement
    if (parent?.closest('.sr-only, svg')) continue
    if (n.nodeValue?.trim()) out.push(n as Text)
  }
  return out
}

/** Shows the new text right away (the page itself is refreshed a moment later). */
function setShownText(el: Element, value: string, old?: string) {
  const nodes = textNodes(el)
  let node = old !== undefined ? nodes.find((n) => n.nodeValue?.trim() === old.trim()) : undefined
  if (!node && (nodes.length === 1 || old === undefined)) node = nodes[0]
  if (node && node.nodeValue !== value) node.nodeValue = value
}

const sameMark = (el: Element, d: string, p: string) => {
  const m = readMark(el.getAttribute(EDIT_ATTR))
  return Boolean(m && m.d === d && m.p === p)
}

export function EditSite({ pages }: { pages: PageOption[] }) {
  const [session, setSession] = useState<EditSession | null>(null)
  const version = useSyncExternalStore(
    session?.subscribe ?? noop,
    () => session?.version ?? 0,
    () => 0,
  )
  const [locale, setLocale] = useState<Locale>('ar')
  const [path, setPath] = useState('')
  const [src, setSrc] = useState<string | null>(null)
  const [hover, setHover] = useState<Element | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  /** Size of the frame (the overlay is placed inside it); updated on scroll / resize. */
  const [box, setBox] = useState({ w: 0, h: 0, n: 0 })
  const [pending, setPending] = useState<PendingDoc[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [frameError, setFrameError] = useState('')

  const frameRef = useRef<HTMLIFrameElement>(null)
  const unwire = useRef<(() => void) | null>(null)
  const wiredDoc = useRef<Document | null>(null)
  const openAfter = useRef<{ d: string; p: string } | null>(null)
  const localeRef = useRef<Locale>('ar')
  const showAllRef = useRef(false)
  const sessionRef = useRef<EditSession | null>(null)
  const pendingTimer = useRef<number>(0)

  /* ───── start: session (this browser) + page from the address (?page=&lang=) ───── */
  useEffect(() => {
    const s = new EditSession()
    sessionRef.current = s
    const q = new URLSearchParams(window.location.search)
    const l: Locale = q.get('lang') === 'he' ? 'he' : 'ar'
    const p = q.get('page') ?? ''
    /* eslint-disable react-hooks/set-state-in-effect -- the browser (storage, address, screen) is only known here */
    setSession(s)
    setLocale(l)
    setPath(p)
    setSrc(previewSrc(l, p.startsWith('/') || p === '' ? p : ''))
    setNarrow(window.innerWidth < 900)
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => unwire.current?.()
  }, [])

  const bump = useCallback(() => {
    const f = frameRef.current
    setBox((b) => ({ w: f?.clientWidth ?? 0, h: f?.clientHeight ?? 0, n: b.n + 1 }))
  }, [])

  useEffect(() => {
    window.addEventListener('resize', bump)
    return () => window.removeEventListener('resize', bump)
  }, [bump])

  const refreshPending = useCallback(() => {
    window.clearTimeout(pendingTimer.current)
    pendingTimer.current = window.setTimeout(() => {
      listPending()
        .then(setPending)
        .catch(() => undefined)
    }, 500)
  }, [])

  useEffect(() => {
    refreshPending()
  }, [refreshPending])

  const say = useCallback((t: Toast) => {
    setToast(t)
    if (t.kind !== 'err') window.setTimeout(() => setToast((x) => (x === t ? null : x)), 3500)
  }, [])

  /* ───── the site page inside the frame ───── */

  /** Changes of documents without drafts wait in this browser — show them on the page too. */
  const showWaiting = useCallback((doc: Document) => {
    const s = sessionRef.current
    if (!s) return
    const overlay = s.overlay
    if (!Object.keys(overlay).length) return
    doc.querySelectorAll(`[${EDIT_ATTR}]`).forEach((el) => {
      const m = readMark(el.getAttribute(EDIT_ATTR))
      if (!m || isVersioned(m.d)) return
      const o = overlay[m.d]?.[localeRef.current]
      if (!o) return
      if (m.k === 'text' || m.k === 'textarea') {
        if (!(topKey(m.p) in o)) return
        const v = getAt(o, m.p)
        if (typeof v === 'string') setShownText(el, v)
        return
      }
      for (const [name, type] of m.f ?? []) {
        const p = joinPath(m.p, name)
        if (type !== 'image' || !(topKey(p) in o)) continue
        void getMedia(relId(getAt(o, p))).then((md) => {
          const img = el instanceof HTMLImageElement || el.tagName === 'IMG' ? el : el.querySelector('img')
          const url = md ? thumbOf(md) : ''
          if (img && url && img.getAttribute('src') !== url) {
            img.removeAttribute('srcset')
            img.setAttribute('src', url)
          }
        })
      }
    })
  }, [])

  const refreshFrame = useCallback(async (hard = false) => {
    const win = frameRef.current?.contentWindow as (Window & { next?: { router?: { refresh?: () => void } } }) | null
    if (!win) return
    // keep preview on (the «شوف الموقع» tab turns it off for this browser)
    await fetch('/next/preview?path=%2F', { credentials: 'include', redirect: 'manual', cache: 'no-store' }).catch(() => undefined)
    try {
      const router = win.next?.router
      if (!hard && router?.refresh) router.refresh()
      else win.location.reload()
    } catch {
      frameRef.current?.setAttribute('src', frameRef.current.getAttribute('src') ?? '')
    }
  }, [])

  const openEl = useCallback((el: Element) => {
    const mark = readMark(el.getAttribute(EDIT_ATTR))
    if (!mark) return
    setHover(null)
    setListOpen(false)
    setActive({ el, mark })
  }, [])

  /**
   * Connects to the page inside the frame: as soon as its HTML is there (not only after every
   * picture and video has loaded), and again after each move to another page.
   */
  const wire = useCallback((fromLoad = false) => {
    const frame = frameRef.current
    let win: Window | null = null
    let doc: Document | null = null
    try {
      win = frame?.contentWindow ?? null
      doc = frame?.contentDocument ?? null
    } catch {
      return
    }
    if (!win || !doc || !doc.documentElement || doc.readyState === 'loading') return
    if (doc === wiredDoc.current) return
    if (!fromLoad && !/^\/(ar|he)(\/|$)/.test(win.location.pathname)) return
    unwire.current?.()
    unwire.current = null
    wiredDoc.current = doc
    setActive(null)
    setHover(null)
    const m = win.location.pathname.match(/^\/(ar|he)(\/.*)?$/)
    if (!m) {
      setFrameError(
        win.location.pathname.startsWith('/next/preview')
          ? 'ما قدرنا نفتح وضع المعاينة — يمكن انتهى الدخول. حدّث الصفحة أو سجّل دخول من جديد.'
          : '',
      )
      return
    }
    setFrameError('')
    const l = m[1] as Locale
    const p = decodeURI(m[2] ?? '')
    localeRef.current = l
    setLocale(l)
    setPath(p)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('lang', l)
      if (p) url.searchParams.set('page', p)
      else url.searchParams.delete('page')
      window.history.replaceState(window.history.state, '', url)
    } catch {
      // address not updated — no harm
    }

    const root = doc.documentElement
    const w = win as Window & typeof globalThis
    const d = doc
    const prep = () => {
      if (!root.hasAttribute('data-edit-mode')) root.setAttribute('data-edit-mode', '')
      root.classList.toggle('es-show-all', showAllRef.current)
      // stop everything that moves by itself (strips, graduates rotation, hero video) — the site's own «stop motion»
      if (!root.classList.contains('motion-off')) {
        root.classList.add('motion-off')
        w.dispatchEvent(new w.Event('almrkz:motion'))
      }
      if (!d.getElementById('es-style')) {
        const s = d.createElement('style')
        s.id = 'es-style'
        s.textContent = FRAME_CSS
        d.head.appendChild(s)
      }
    }
    // after React has taken over the page (changing <html> before that makes React complain
    // that the page doesn't match); at most ~10 seconds
    let tries = 0
    let ready = false
    const hydrated = () => Object.keys(d.body ?? {}).some((k) => k.startsWith('__react'))
    const prepTimer = window.setInterval(() => {
      if (!hydrated() && ++tries < 40) return
      window.clearInterval(prepTimer)
      ready = true
      prep()
      showWaiting(d)
    }, 250)

    const markOf = (t: EventTarget | null) =>
      t && (t as Element).closest ? (t as Element).closest(`[${EDIT_ATTR}]`) : null
    const over = (e: MouseEvent) => setHover(markOf(e.target))
    const out = (e: MouseEvent) => {
      if (!e.relatedTarget) setHover(null)
    }
    const click = (e: MouseEvent) => {
      const el = markOf(e.target)
      if (el) {
        e.preventDefault()
        e.stopPropagation()
        openEl(el)
        return
      }
      const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      let leaves = a.target === '_blank'
      try {
        const u = new URL(a.href, w.location.href)
        leaves ||= u.origin !== w.location.origin || /^\/(admin|api|next)(\/|$)/.test(u.pathname)
      } catch {
        leaves = true
      }
      if (leaves) {
        e.preventDefault()
        e.stopPropagation()
        say({ kind: 'info', text: 'بوضع التعديل الروابط لبرّا الموقع (واتساب، تلفون، مواقع ثانية) مسكّرة.' })
      }
    }
    const submit = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      say({ kind: 'info', text: 'الاستمارة ما بتنبعت من وضع التعديل.' })
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    let raf = 0
    const moved = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(bump)
    }
    let timer = 0
    const changed = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!ready) return
        prep()
        showWaiting(d)
        // after «زيد واحد جديد»: open the new one as soon as it shows up
        const want = openAfter.current
        if (want) {
          const el = Array.from(d.querySelectorAll(`[${EDIT_ATTR}]`)).find((x) => sameMark(x, want.d, want.p))
          if (el) {
            openAfter.current = null
            el.scrollIntoView({ block: 'center' })
            openEl(el)
          }
        }
        // the page was refreshed: follow the element that is being edited
        setActive((a) => {
          if (!a || a.el.isConnected) return a
          const again = Array.from(d.querySelectorAll(`[${EDIT_ATTR}]`)).find((x) => sameMark(x, a.mark.d, a.mark.p))
          return again ? { ...a, el: again } : a
        })
        setHover((h) => (h && !h.isConnected ? null : h))
        bump()
      }, 80)
    }
    d.addEventListener('mouseover', over)
    d.addEventListener('mouseout', out)
    d.addEventListener('click', click, true)
    d.addEventListener('submit', submit, true)
    d.addEventListener('keydown', key)
    d.addEventListener('scroll', moved, true)
    w.addEventListener('resize', moved)
    const mo = new w.MutationObserver(changed)
    mo.observe(d.body, { childList: true, subtree: true, characterData: true })
    mo.observe(root, { attributes: true, attributeFilter: ['class', 'data-edit-mode'] })
    unwire.current = () => {
      window.clearInterval(prepTimer)
      mo.disconnect()
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      d.removeEventListener('mouseover', over)
      d.removeEventListener('mouseout', out)
      d.removeEventListener('click', click, true)
      d.removeEventListener('submit', submit, true)
      d.removeEventListener('keydown', key)
      d.removeEventListener('scroll', moved, true)
      w.removeEventListener('resize', moved)
    }
  }, [bump, openEl, say, showWaiting])

  const onLoad = useCallback(() => wire(true), [wire])

  // don't wait for the frame's «load» (it waits for every picture/video): check a few times a second
  useEffect(() => {
    const iv = window.setInterval(() => wire(), 250)
    return () => window.clearInterval(iv)
  }, [wire])

  useEffect(() => {
    showAllRef.current = showAll
    frameRef.current?.contentDocument?.documentElement?.classList.toggle('es-show-all', showAll)
  }, [showAll])

  const go = (l: Locale, p: string) => {
    setActive(null)
    setSrc(previewSrc(l, p))
    setLocale(l)
    setPath(p)
  }

  /* ───── after a save / undo / publish ───── */

  /** A save finished (the editors report it here; the page is updated in the effect below). */
  const [saved, setSaved] = useState<{ after: AfterSave; mark: EditMark; n: number } | null>(null)
  const onSaved = useCallback(
    (after: AfterSave, mark: EditMark) => setSaved((x) => ({ after, mark, n: (x?.n ?? 0) + 1 })),
    [],
  )
  useEffect(() => {
    if (!saved) return
    const { after, mark } = saved
    const doc = frameRef.current?.contentDocument
    if (doc && after.changed && (mark.k === 'text' || mark.k === 'textarea')) {
      doc.querySelectorAll(`[${EDIT_ATTR}]`).forEach((el) => {
        if (sameMark(el, mark.d, mark.p)) setShownText(el, after.changed!.value, after.changed!.old)
      })
    }
    if (after.openAfter) openAfter.current = after.openAfter
    if (isVersioned(mark.d)) void refreshFrame()
    else if (doc) {
      showWaiting(doc)
      if (after.openAfter || mark.k === 'fields') void refreshFrame(true)
    }
    refreshPending()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a message after a save (once per save)
    say({ kind: 'ok', text: 'انحفظ ✓ (لسّا مش منشور)' })
  }, [saved, refreshFrame, refreshPending, say, showWaiting])

  const undo = async () => {
    if (!session) return
    const wasVersioned = session.lastVersioned
    try {
      const label = await session.undo()
      if (label) say({ kind: 'ok', text: `رجّعنا: ${label}` })
      void refreshFrame(!wasVersioned)
      refreshPending()
    } catch (e) {
      say({ kind: 'err', text: `ما قدرنا نرجّع: ${explainError(e)}` })
    }
  }

  const touched = session?.touched ?? []
  const touchedDocs = new Set(touched.map((t) => t.d))
  // «انشر» publishes what was changed HERE. Drafts started in the full forms (e.g. a course that
  // isn't finished yet) are only listed — publishing them by surprise could put half-done pages live.
  const older = pending.filter((p) => !touchedDocs.has(p.d))
  const count = session?.count ?? 0
  const pendingLabel = new Map(pending.map((p) => [p.d, p.label]))
  const docList = touched.map((t) => ({
    d: t.d,
    label: pendingLabel.get(t.d) ?? (t.d === 'homepage' ? 'الصفحة الرئيسية' : t.label),
  }))

  /** An older draft (not from this session), published on purpose from the list. */
  const publishOne = async (x: PendingDoc) => {
    setPublishing(true)
    try {
      const res = await publishDocs([x.d])
      if (res.failed.length) say({ kind: 'err', text: `«${x.label}» ما انتشر: ${res.failed[0].message}` })
      else say({ kind: 'ok', text: `«${x.label}» انتشر ✓` })
    } catch (e) {
      say({ kind: 'err', text: `ما قدرنا ننشر: ${explainError(e)}` })
    } finally {
      setPublishing(false)
      refreshPending()
      void refreshFrame(true)
    }
  }

  const publish = async () => {
    if (!session) return
    setConfirm(false)
    setPublishing(true)
    setActive(null)
    try {
      await session.settle()
      const failedWaiting = await session.writeWaiting()
      const targets = session.touched.filter((t) => t.versioned).map((t) => t.d)
      const res = await publishDocs(targets)
      session.published(res.published)
      const problems = [
        ...failedWaiting,
        ...res.failed.map((f) => `«${pendingLabel.get(f.d) ?? touched.find((t) => t.d === f.d)?.label ?? f.d}»: ${f.message}`),
      ]
      if (problems.length) say({ kind: 'err', text: ['في إشي ما انتشر:', ...problems].join('\n') })
      else say({ kind: 'ok', text: 'انتشر ✓ — الزوار بيشوفوا التغييرات هلأ.' })
    } catch (e) {
      say({ kind: 'err', text: `ما قدرنا ننشر: ${explainError(e)}` })
    } finally {
      setPublishing(false)
      refreshPending()
      void refreshFrame(true)
    }
  }

  /* ───── overlay positions (inside the frame's box) ───── */
  const hoverRect = hover?.isConnected ? hover.getBoundingClientRect() : null
  const hoverMark = hover ? readMark(hover.getAttribute(EDIT_ATTR)) : null
  const popStyle = (): React.CSSProperties => {
    const r = active?.el.isConnected ? active.el.getBoundingClientRect() : null
    const width = Math.min(440, box.w - 16)
    if (!r) return { top: 12, right: 12, width }
    const right = Math.max(8, Math.min(box.w - r.right, box.w - width - 8))
    // under the element if there's room, else above it; when neither side has room, it slides
    // over the element (the text being edited is inside the box anyway)
    const need = Math.min(400, box.h - 16)
    if (box.h - r.bottom >= r.top) {
      const top = Math.max(8, Math.min(r.bottom + 10, box.h - need - 8))
      return { top, right, width, maxHeight: box.h - top - 8 }
    }
    const bottom = Math.max(8, Math.min(box.h - r.top + 10, box.h - need - 8))
    return { bottom, right, width, maxHeight: box.h - bottom - 8 }
  }
  void version

  const exitHref = `/next/exit-preview?path=${encodeURIComponent(`/${locale}${path}`)}`
  const groups = [...new Set(pages.map((p) => p.group))]
  const known = pages.some((p) => p.path === path)
  const common = active && session
    ? {
        mark: active.mark,
        locale,
        session,
        onClose: () => setActive(null),
        onSaved,
      }
    : null

  if (narrow) {
    return (
      <div className="es es-narrow" dir="rtl">
        <h1>✎ عدّل الموقع</h1>
        <p>التعديل على الموقع مريح أكثر على شاشة كمبيوتر أو لابتوب — الشاشة هون صغيرة.</p>
        <button type="button" className="es-btn es-btn--primary" onClick={() => setNarrow(false)}>
          كمّل هيك
        </button>
      </div>
    )
  }

  return (
    <div className="es" dir="rtl">
      <div className="es-bar">
        <div className="es-bar__main">
          <h1 className="es-title">✎ عدّل الموقع</h1>
          <label className="es-select">
            <span>الصفحة</span>
            <select value={known ? path : '__other'} onChange={(e) => e.target.value !== '__other' && go(locale, e.target.value)}>
              {!known && <option value="__other">{path || '—'}</option>}
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {pages
                    .filter((p) => p.group === g)
                    .map((p) => (
                      <option key={p.path} value={p.path}>
                        {p.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="es-lang" role="group" aria-label="لغة الصفحة">
            {(['ar', 'he'] as Locale[]).map((l) => (
              <button key={l} type="button" aria-pressed={locale === l} onClick={() => locale !== l && go(l, path)}>
                {LANG_NAME[l]}
              </button>
            ))}
          </div>
          <label className="es-check">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            ورجيني كل اللي بينعدّل
          </label>
        </div>
        <div className="es-bar__status">
          {session && session.busy > 0 && <span className="es-muted">عم يحفظ…</span>}
          {count ? (
            <button type="button" className="es-count" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
              عندك {count === 1 ? 'تغيير واحد غير منشور' : `${count} تغييرات غير منشورة`} ▾
            </button>
          ) : (
            <button type="button" className="es-ok" aria-expanded={listOpen} onClick={() => older.length && setListOpen(!listOpen)}>
              ✓ ما في تغييرات مستنّية{older.length ? ` · ${older.length} مسودات قديمة ▾` : ''}
            </button>
          )}
          <button
            type="button"
            className="es-btn"
            disabled={!session?.canUndo || publishing}
            onClick={undo}
            title={session?.canUndo ? `بيرجّع آخر تغيير: ${session.lastLabel}` : 'ما في إشي نرجّعه'}
          >
            ↶ تراجع
          </button>
          <button
            type="button"
            className="es-btn es-btn--publish"
            disabled={!count || publishing}
            onClick={() => setConfirm(true)}
          >
            {publishing ? 'عم ينشر…' : 'انشر التغييرات'}
          </button>
          <a className="es-btn es-btn--quiet" href={exitHref} target="_blank" rel="noopener" title="الموقع زي ما الزوار بيشوفوه (بدون المسودات)">
            شوف الموقع ↗
          </a>
        </div>
        {listOpen && (count > 0 || older.length > 0) && (
          <div className="es-list">
            {count > 0 && (
              <>
                <p>هدول رح ينتشروا لما تكبس «انشر التغييرات»:</p>
                <ul>
                  {docList.map((x) => (
                    <li key={x.d}>{x.label}</li>
                  ))}
                </ul>
              </>
            )}
            {older.length > 0 && (
              <>
                <p className="es-list__older">
                  مسودات قديمة (من قبل، أو من الفورم الكامل) — «انشر التغييرات» ما بينشرها. شوفها، وانشرها إذا خالصة:
                </p>
                <ul>
                  {older.map((x) => (
                    <li key={x.d} className="es-list__row">
                      <a href={formHref(x.d)} target="_blank" rel="noopener">
                        {x.label} ↗
                      </a>
                      <button type="button" className="es-btn es-btn--small" disabled={publishing} onClick={() => publishOne(x)}>
                        انشر هاي
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
      <p className="es-help">
        مرّر الماوس على أي نص، صورة أو فيديو — بيطلع حواليه إطار أخضر. اكبس عليه وغيّره. كل شي بيضل <b>مسودة</b> (الزوار ما
        بيشوفوه) لحد ما تكبس «انشر التغييرات».
      </p>
      <div className="es-stage">
        {src && (
          <iframe
            ref={frameRef}
            src={src}
            title="الموقع — وضع التعديل"
            onLoad={onLoad}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        )}
        <div className="es-layer">
          {hoverRect && hoverMark && !active && (
            <>
              <div
                className="es-outline"
                style={{ top: hoverRect.top - 4, left: hoverRect.left - 4, width: hoverRect.width + 8, height: hoverRect.height + 8 }}
              />
              <div
                className="es-chip"
                style={{
                  top: hoverRect.top > 30 ? hoverRect.top - 30 : hoverRect.top + 6,
                  right: Math.max(4, box.w - hoverRect.right - 4),
                }}
              >
                ✎ {hoverMark.l}
              </div>
            </>
          )}
          {active && common && (active.mark.k === 'text' || active.mark.k === 'textarea') && (
            <TextEditor key={`${active.mark.d}|${active.mark.p}`} {...common} style={popStyle()} />
          )}
          {active && common && active.mark.k === 'form' && (
            <FormOnly mark={active.mark} onClose={common.onClose} style={popStyle()} />
          )}
          {active && common && active.mark.k === 'fields' && (
            <FieldsDialog key={`${active.mark.d}|${active.mark.p}`} {...common} />
          )}
          {frameError && <div className="es-toast es-toast--err">{frameError}</div>}
          {toast && (
            <div className={`es-toast es-toast--${toast.kind}`} role={toast.kind === 'err' ? 'alert' : 'status'}>
              <span>{toast.text}</span>
              <button type="button" className="es-x" onClick={() => setToast(null)} aria-label="سكّر">
                ✕
              </button>
            </div>
          )}
          {confirm && (
            <div className="es-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(false)}>
              <div className="es-dialog es-dialog--small" role="dialog" aria-label="انشر التغييرات">
                <div className="es-pop__head">
                  <b>تنشر هلأ؟</b>
                </div>
                <p>بعد النشر كل الزوار بيشوفوا التغييرات، بالعربي وبالعبري:</p>
                <ul className="es-publish-list">
                  {docList.map((x) => (
                    <li key={x.d}>{x.label}</li>
                  ))}
                </ul>
                <div className="es-actions">
                  <button type="button" className="es-btn es-btn--publish" onClick={publish}>
                    انشر هلأ
                  </button>
                  <button type="button" className="es-btn" onClick={() => setConfirm(false)}>
                    لسّا
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
