'use client'

import { usePathname } from 'next/navigation'
import React, {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { trackLead } from '@/lib/analytics'

import { MOTION_STORAGE_KEY } from './a11y-text'
import type { LeadState } from './actions'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloseIcon,
  MenuIcon,
  PauseIcon,
  ResumeIcon,
  PlayIcon,
  PlusIcon,
  WhatsAppIcon,
} from './icons'

/*
 * «Stop motion» (accessibility, WCAG 2.2.2): the header has a button that stops everything that
 * moves by itself — the hero video, the moving strips, the graduates' auto-rotation. The choice is
 * a class on <html> (site.css pauses the animations) and is remembered on this device.
 */
const MOTION_KEY = MOTION_STORAGE_KEY
const MOTION_EVENT = 'almrkz:motion'
export const motionOff = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('motion-off')
export const subscribeMotion = (cb: () => void) => {
  window.addEventListener(MOTION_EVENT, cb)
  return () => window.removeEventListener(MOTION_EVENT, cb)
}
const applyMotion = (off: boolean) => {
  document.documentElement.classList.toggle('motion-off', off)
  window.dispatchEvent(new Event(MOTION_EVENT))
}
/** Visitor asked the device (or the header button) for less motion. */
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches || motionOff())

export function MotionToggle({
  pauseLabel,
  resumeLabel,
}: {
  pauseLabel: string
  resumeLabel: string
}) {
  const off = useSyncExternalStore(subscribeMotion, motionOff, () => false)
  // No saved choice yet: start from the device's own «reduce motion» setting.
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(MOTION_KEY)
    } catch {}
    const initial =
      stored === '1' ||
      (stored === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (initial !== motionOff()) applyMotion(initial)
  }, [])
  return (
    <button
      type="button"
      className="icon-btn square motion-btn"
      aria-pressed={off}
      aria-label={off ? resumeLabel : pauseLabel}
      title={off ? resumeLabel : pauseLabel}
      onClick={() => {
        try {
          localStorage.setItem(MOTION_KEY, off ? '0' : '1')
        } catch {}
        applyMotion(!off)
      }}
    >
      {off ? <ResumeIcon size={16} /> : <PauseIcon size={16} />}
    </button>
  )
}

/**
 * Ref callback: move the keyboard focus to an element that just replaced the button the visitor
 * pressed (video player, YouTube frame, «thank you» message) — otherwise focus falls to the page top.
 */
const focusOnMount = (el: HTMLElement | null) => el?.focus({ preventScroll: true })

/**
 * Marks [data-reveal] elements with `data-in` when they scroll into view (site.css fades them in).
 * An attribute, not a class: React owns `className` and rewrites it whenever it changes (an FAQ
 * item opening, a tab turning active…). A class added here would be wiped by that re-render, the
 * element would fade out and animate back in — the «answer disappears and comes back» flicker.
 * React never touches attributes it did not render, so `data-in` stays.
 */
export function RevealObserver() {
  useEffect(() => {
    document.documentElement.classList.remove('no-js')
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    )
    const scan = () =>
      document.querySelectorAll('[data-reveal]:not([data-in])').forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
  return null
}

/**
 * Links to a section further down the page (#register, #faq, /ar#contact…) must land on it.
 * perf.css lets the browser skip the layout of far-away sections (`content-visibility: auto`) and
 * count them as 640px placeholders; the real sections are taller, so the jump stopped short of
 * the target (the «سجّل اهتمامك» button showed the gallery instead of the form). Just before the
 * jump, the sections above the target are laid out for real so the browser measures the right spot.
 */
export function HashScroll() {
  useEffect(() => {
    /** Lays out every skipped section before (or containing) the target. */
    const prepare = (id: string) => {
      const target = id ? document.getElementById(id) : null
      if (!target) return null
      document.querySelectorAll<HTMLElement>('main > section, .footer').forEach((s) => {
        const before = s.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING
        if (before || s.contains(target)) s.style.contentVisibility = 'visible'
      })
      return target
    }
    const idOf = (hash: string) => {
      try {
        return decodeURIComponent(hash.slice(1))
      } catch {
        return ''
      }
    }
    // Opened with an address that has #…: the browser already started its (smooth) jump to the
    // spot it measured with the placeholders — correct it a few times while the page settles,
    // until the visitor scrolls or taps themselves.
    let touched = false
    const onTouch = () => {
      touched = true
    }
    const fixLoadJump = () => {
      if (touched) return
      const target = prepare(idOf(location.hash))
      if (!target) return
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
      if (Math.abs(target.getBoundingClientRect().top - margin) > 2)
        target.scrollIntoView({ behavior: 'instant' })
    }
    const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    const timers: number[] = []
    if (location.hash.length > 1) {
      inputs.forEach((t) => window.addEventListener(t, onTouch, { once: true, passive: true }))
      fixLoadJump()
      for (const ms of [100, 300, 700, 1200, 2000]) timers.push(window.setTimeout(fixLoadJump, ms))
      if (document.readyState !== 'complete') window.addEventListener('load', fixLoadJump)
    }
    // A click on a link to a section of this same page: prepare, then let the browser jump
    // (keeps its smooth scrolling, history entry and keyboard focus).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="#"]')
      if (!(a instanceof HTMLAnchorElement)) return
      if (a.origin !== location.origin || a.pathname !== location.pathname) return
      prepare(idOf(a.hash))
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('load', fixLoadJump)
      timers.forEach((t) => clearTimeout(t))
      inputs.forEach((t) => window.removeEventListener(t, onTouch))
    }
  }, [])
  return null
}

type MenuLink = { href: string; label: string }

export function HeaderMenu({
  links,
  registerHref,
  registerLabel,
  whatsappHref,
  whatsappLabel,
  menuLabel,
  navLabel,
  newTabLabel,
}: {
  links: MenuLink[]
  registerHref: string
  registerLabel: string
  whatsappHref: string
  whatsappLabel: string
  menuLabel: string
  /** Name of the menu's <nav> for screen readers. */
  navLabel?: string
  /** «opens in a new window» — read out after the WhatsApp link. */
  newTabLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  // Esc closes the menu and puts the keyboard focus back on the menu button.
  // A tap/click anywhere outside the menu (and its button) closes it too.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null
      if (t && !panel.current?.contains(t) && !toggle.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])
  return (
    <>
      <button
        ref={toggle}
        className="icon-btn square"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div ref={panel} className="glass menu-panel" id="site-menu">
          <nav aria-label={navLabel || menuLabel}>
            {links.map((m, i) => (
              <a key={m.href + i} href={m.href} onClick={close}>
                <span>{m.label}</span>
                <small aria-hidden="true">{String(i + 1).padStart(2, '0')}</small>
              </a>
            ))}
          </nav>
          <div className="two">
            <a href={registerHref} onClick={close} className="btn btn-green">
              {registerLabel}
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener" className="btn btn-wa">
              <WhatsAppIcon size={20} />
              {whatsappLabel}
              {newTabLabel && <span className="sr-only"> ({newTabLabel})</span>}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

/** Horizontal carousel with prev/next buttons (RTL). */
export function Carousel({
  children,
  hint,
  header,
  prevLabel,
  nextLabel,
}: {
  children: React.ReactNode
  hint?: string | null
  header: React.ReactNode
  /** Names of the prev/next buttons for screen readers («السابق» / «التالي»). */
  prevLabel: string
  nextLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (dir: 1 | -1) => {
    const el = ref.current
    if (el)
      el.scrollBy({
        left: dir * el.clientWidth * 0.6,
        behavior: reducedMotion() ? 'auto' : 'smooth',
      })
  }
  return (
    <>
      <div data-reveal="" className="section-head">
        {header}
        <div className="fields-nav">
          {hint && (
            <span className="fields-hint">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
              {hint}
            </span>
          )}
          <button className="round-btn" aria-label={prevLabel} onClick={() => move(1)}>
            <ChevronRight />
          </button>
          <button className="round-btn solid" aria-label={nextLabel} onClick={() => move(-1)}>
            <ChevronLeft />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="snap"
        style={{ gap: 16, paddingBottom: 18, scrollBehavior: 'smooth' }}
      >
        {children}
      </div>
    </>
  )
}

/** Numbers that count up once the strip is visible. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setShown(0)
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / 1500)
          setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return (
    <>
      <span ref={ref} aria-hidden="true">
        {shown}
      </span>
      <span className="sr-only">{value}</span>
    </>
  )
}

export type StoryView = {
  id: number
  name: string
  /** اختياري — قصة بدون اقتباس بتطلع بالنص القصير أو بالاسم والصورة بس */
  quote?: string | null
  body?: string | null
  now?: string | null
  courseName?: string | null
  image?: string
  video?: string
  dur?: string | null
  /** «عدّل الموقع» marks (preview mode only) */
  edit?: Partial<Record<'quote' | 'body' | 'name' | 'now' | 'photo', Record<string, string>>>
}

export function Stories({
  stories,
  videoLabel,
  rotateSeconds,
  labels,
}: {
  stories: StoryView[]
  videoLabel?: string | null
  rotateSeconds: number
  /** Screen-reader names: play button prefix + the pause/resume button of the auto-rotation. */
  labels: { play: string; pause: string; resume: string }
}) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Auto-rotation stops when the visitor presses pause, while the mouse or keyboard focus is
  // inside, and never starts for visitors who asked their device for less motion.
  const reduced = useSyncExternalStore(subscribeMotion, reducedMotion, () => false)
  const [pausedByVisitor, setPaused] = useState<boolean | null>(null)
  const paused = pausedByVisitor ?? reduced
  const [hold, setHold] = useState(false)
  const ticks = useRef(0)
  useEffect(() => {
    ticks.current = 0
    if (stories.length < 2 || paused || hold) return
    const iv = setInterval(() => {
      if (playing) return
      ticks.current += 1
      if (ticks.current * 500 < rotateSeconds * 1000) return
      ticks.current = 0
      setI((x) => (x + 1) % stories.length)
    }, 500)
    return () => clearInterval(iv)
  }, [stories.length, rotateSeconds, playing, paused, hold])
  const s = stories[i]
  if (!s) return null
  const pick = (n: number) => {
    ticks.current = 0
    setPlaying(false)
    setI(n)
  }
  return (
    <div
      data-reveal=""
      className="stories"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false)
      }}
    >
      <div className="story-text" key={`t${s.id}`}>
        {s.courseName && <span className="soft-pill">{s.courseName}</span>}
        {s.quote && (
          <p className="story-quote" {...s.edit?.quote}>
            “{s.quote}”
          </p>
        )}
        {s.body && (
          <p className="story-body" {...s.edit?.body}>
            {s.body}
          </p>
        )}
        {s.quote || s.body ? (
          <div className="story-who">
            {s.image && <img src={s.image} alt="" decoding="async" />}
            <div>
              <b {...s.edit?.name}>{s.name}</b>
              {s.now && <small {...s.edit?.now}>{s.now}</small>}
            </div>
          </div>
        ) : (
          // بدون اقتباس ونص: الاسم كبير (بدل ما يضل المكان فاضي)
          <p className="story-quote">
            <span {...s.edit?.name}>{s.name}</span>
            {s.now && (
              <small {...s.edit?.now} style={{ display: 'block', marginTop: 8, fontSize: 15, color: '#3a7a20' }}>{s.now}</small>
            )}
          </p>
        )}
        <div className="story-tabs">
          {stories.map((x, n) => (
            <button key={x.id} aria-label={x.name} aria-current={n === i} onClick={() => pick(n)} />
          ))}
          {stories.length > 1 && (
            <button
              className="story-pause"
              aria-label={paused ? labels.resume : labels.pause}
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <ResumeIcon /> : <PauseIcon />}
            </button>
          )}
        </div>
      </div>
      <div className="zoom story-photo" key={`p${s.id}`} {...s.edit?.photo}>
        {playing && s.video ? (
          <video
            ref={focusOnMount}
            src={s.video}
            controls
            autoPlay
            playsInline
            className="cover"
            style={{ background: '#000' }}
            title={s.name}
          />
        ) : (
          <>
            {s.image && <img src={s.image} alt={s.name} className="cover" decoding="async" />}
            <div
              className="shade-bottom"
              style={{ background: 'linear-gradient(to top,rgba(5,38,19,.8),rgba(5,38,19,0) 55%)' }}
            />
            {s.video && (
              <button
                className="play ring"
                aria-label={`${labels.play}: ${s.name}`}
                onClick={() => setPlaying(true)}
              >
                <PlayIcon />
              </button>
            )}
            <div className="story-cap">
              <div>
                {s.video && videoLabel && <small>{videoLabel}</small>}
                <p>{s.name}</p>
              </div>
              {s.video && s.dur && (
                <span dir="ltr" className="dur">
                  {s.dur}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Seconds the moving staff strip takes to pass one card. */
const STAFF_SECONDS_PER_CARD = 7
/** After a swipe / arrow press, the strip waits this long before it moves again. */
const STAFF_HOLD_MS = 2500

/**
 * The staff strip: moves by itself (the cards are rendered 3 times, the middle copy is the real
 * one), and it is a real scroll box, so a finger / trackpad can swipe it. A click on a card stops
 * it and marks that card; a click on the same card or anywhere outside the strip starts it again.
 * The arrows move one card; the round button stops / starts. Nothing moves by itself for visitors
 * who asked for less motion (device setting or the header button) — they use the arrows.
 */
export function StaffStrip({
  children,
  labels,
}: {
  children: React.ReactNode
  labels: { prev: string; next: string; pause: string; resume: string; hint: string }
}) {
  const box = useRef<HTMLDivElement>(null)
  const reduced = useSyncExternalStore(subscribeMotion, reducedMotion, () => false)
  const [pausedByVisitor, setPaused] = useState(false)
  const paused = pausedByVisitor || reduced
  // read inside the animation loop without restarting it
  const hold = useRef({ until: 0, focus: false })

  const cards = () =>
    Array.from(box.current?.querySelectorAll<HTMLElement>('.staff-card') ?? [])
  /** Width of one copy of the list (card 0 of the middle copy minus card 0 of the first). */
  const period = (list: HTMLElement[]) => {
    const n = list.length / 3
    return n >= 1 ? list[n].offsetLeft - list[0].offsetLeft : 0
  }
  const unpick = () =>
    box.current?.querySelectorAll('.staff-card.picked').forEach((c) => c.classList.remove('picked'))

  // start on the middle copy
  useEffect(() => {
    const el = box.current
    if (el) el.scrollLeft = period(cards())
  }, [])

  // the movement: only while on screen, the tab is visible and nobody stopped it
  useEffect(() => {
    const el = box.current
    if (!el || paused) return
    let raf = 0
    let last = 0
    let pos = el.scrollLeft
    let expected = el.scrollLeft
    let visible = false
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min(now - last, 100) : 0
      last = now
      const list = cards()
      const p = period(list)
      if (!p || !visible || document.hidden) return
      // the visitor scrolled it (finger, trackpad, arrow, keyboard focus): wait a little
      if (Math.abs(el.scrollLeft - expected) > 2) {
        pos = el.scrollLeft
        expected = pos
        hold.current.until = now + STAFF_HOLD_MS
      }
      if (hold.current.focus || now < hold.current.until) return
      const step = list[1] ? list[1].offsetLeft - list[0].offsetLeft : p
      pos += (step / STAFF_SECONDS_PER_CARD) * (dt / 1000)
      // stay on the middle copy — the jump by one copy is invisible
      if (pos >= 2 * p) pos -= p
      if (pos < p) pos += p
      el.scrollLeft = pos
      expected = el.scrollLeft
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(el)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [paused])

  // after a swipe ends near the edge of the copies, jump back to the middle copy (invisible)
  useEffect(() => {
    const el = box.current
    if (!el) return
    let t = 0
    const onScroll = () => {
      clearTimeout(t)
      t = window.setTimeout(() => {
        const p = period(cards())
        if (!p) return
        const max = el.scrollWidth - el.clientWidth
        if (el.scrollLeft < p * 0.5) el.scrollLeft += p
        else if (el.scrollLeft > max - p * 0.5) el.scrollLeft -= p
      }, 180)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  // a click anywhere outside the strip starts it again
  useEffect(() => {
    if (!pausedByVisitor) return
    const onDown = (e: PointerEvent) => {
      const root = box.current?.parentElement
      if (root && !root.contains(e.target as Node)) {
        unpick()
        setPaused(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [pausedByVisitor])

  const onCardClick = (e: React.MouseEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.staff-card')
    if (!card) return
    const onButton = !!(e.target as HTMLElement).closest('button')
    // the same card again (not its «read more» button): start moving again
    if (card.classList.contains('picked') && !onButton) {
      unpick()
      setPaused(false)
      return
    }
    unpick()
    // mark the same person in all 3 copies, so a jump between copies keeps the mark
    const list = cards()
    const n = list.length / 3
    const at = list.indexOf(card) % n
    list.forEach((c, i) => i % n === at && c.classList.add('picked'))
    setPaused(true)
    // bring the whole card into view if the edge of the strip cuts it
    const el = box.current
    if (!el) return
    const b = el.getBoundingClientRect()
    const c = card.getBoundingClientRect()
    const pad = b.width * 0.06
    const dx =
      c.left < b.left + pad ? c.left - b.left - pad : c.right > b.right - pad ? c.right - b.right + pad : 0
    if (dx) el.scrollBy({ left: dx, behavior: reduced ? 'auto' : 'smooth' })
  }

  const move = (dir: 1 | -1) => {
    const el = box.current
    const list = cards()
    if (!el || list.length < 2) return
    unpick()
    hold.current.until = performance.now() + STAFF_HOLD_MS
    el.scrollBy({
      left: dir * (list[1].offsetLeft - list[0].offsetLeft),
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  return (
    <div className="staff-strip">
      <div
        ref={box}
        className="marquee"
        dir="ltr"
        onClick={onCardClick}
        onFocus={(e) => {
          if ((e.target as HTMLElement).matches(':focus-visible')) hold.current.focus = true
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold.current.focus = false
        }}
      >
        <div className="staff-track">{children}</div>
      </div>
      <div className="staff-controls">
        {/* arrows point where the visitor looks: → shows the cards on the right */}
        <button type="button" className="round-btn" aria-label={labels.next} onClick={() => move(1)}>
          <ChevronRight />
        </button>
        {!reduced && (
          <button
            type="button"
            className="round-btn solid"
            aria-label={paused ? labels.resume : labels.pause}
            aria-pressed={paused}
            onClick={() => {
              unpick()
              setPaused(!paused)
            }}
          >
            {paused ? <ResumeIcon size={16} /> : <PauseIcon size={16} />}
          </button>
        )}
        <button type="button" className="round-btn" aria-label={labels.prev} onClick={() => move(-1)}>
          <ChevronLeft />
        </button>
        {!reduced && !paused && <span className="staff-hint">{labels.hint}</span>}
      </div>
    </div>
  )
}

export function StaffBio({
  bio,
  more,
  less,
  tabIndex,
  edit,
}: {
  bio: string
  more: string
  less: string
  /** -1 on the hidden copies of the moving strip (keyboard skips them). */
  tabIndex?: number
  /** «عدّل الموقع» mark (preview mode only) */
  edit?: Record<string, string>
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p className={`staff-bio${open ? ' open' : ''}`} {...edit}>
        {bio}
      </p>
      <button
        className="small-btn"
        aria-expanded={open}
        tabIndex={tabIndex}
        onClick={() => setOpen(!open)}
      >
        {open ? less : more}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
    </>
  )
}

/**
 * Poster + play button; the YouTube iframe (youtube-nocookie) or the video file is
 * only loaded after the click — nothing from YouTube before that.
 */
export function PromoStage({
  video,
  youtubeId,
  children,
  playLabel,
  title,
}: {
  video?: string
  youtubeId?: string
  children: React.ReactNode
  playLabel?: string | null
  /** Accessible name of the player once it is loaded (defaults to playLabel). */
  title?: string | null
}) {
  const [playing, setPlaying] = useState(false)
  if (playing && youtubeId) {
    return (
      <iframe
        ref={focusOnMount}
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title={title || playLabel || 'video'}
      />
    )
  }
  if (playing && video)
    return (
      <video
        ref={focusOnMount}
        src={video}
        controls
        autoPlay
        playsInline
        title={title ?? playLabel ?? undefined}
      />
    )
  return (
    <button className="stage-btn" aria-label={playLabel ?? 'play'} onClick={() => setPlaying(true)}>
      {children}
    </button>
  )
}

export function Reel({
  video,
  label,
  children,
}: {
  video?: string
  /** Screen-reader name of the card when it plays a video («تشغيل الفيديو: …»). */
  label?: string
  children: React.ReactNode
}) {
  const [playing, setPlaying] = useState(false)
  // No video uploaded yet: a plain photo card — nothing to click, no pointer.
  if (!video) {
    return (
      <div className="zoom reel-media" style={{ cursor: 'default' }}>
        {children}
      </div>
    )
  }
  if (playing) {
    return (
      <div className="reel-media">
        <video ref={focusOnMount} src={video} controls autoPlay playsInline title={label} />
      </div>
    )
  }
  return (
    <div
      className="lift zoom reel-media"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => setPlaying(true)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        setPlaying(true)
      }}
    >
      {children}
    </div>
  )
}

export function Faq({
  items,
  marks,
}: {
  items: { question: string; answer: string }[]
  /** «عدّل الموقع» marks per question (preview mode only) */
  marks?: { q?: Record<string, string>; a?: Record<string, string> }[]
}) {
  const [open, setOpen] = useState(0)
  const uid = useId()
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((f, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            data-reveal=""
            className={`glass faq-item${isOpen ? ' open' : ''}`}
            style={{ ['--d' as string]: `${i * 60}ms` }}
          >
            <button
              className="faq-q"
              aria-expanded={isOpen}
              aria-controls={`${uid}-a${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }} {...marks?.[i]?.q}>
                <span className="n" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {f.question}
              </span>
              <span className="faq-ic" aria-hidden="true">
                <PlusIcon />
              </span>
            </button>
            <div
              id={`${uid}-a${i}`}
              className="faq-body"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              inert={!isOpen}
            >
              <div>
                <p className="faq-a" {...marks?.[i]?.a}>
                  {f.answer}
                </p>

              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export type FormLabels = {
  name: string
  phone: string
  course: string
  courseAny: string
  message: string
  submit: string
  /** Optional short sentence from the admin panel, shown above the legal notice. */
  privacy: string
  /**
   * Privacy notice under the form (section 11 of the Privacy Protection Law): what is collected,
   * why, who sees it, how long it is kept. Always shown, in code (notice-text.ts).
   */
  notice: string
  /** Link to the privacy policy page, shown after the notice. */
  privacyLink?: { href: string; label: string }
  /** Separate, unchecked opt-in for marketing messages (חוק הספאם). */
  marketing: string
  successTitle: string
  successText: string
  error: string
  /** Same visitor sent too many forms in a short time. */
  tooMany: string
  /** «Send» pressed a moment after the form appeared (typical of bots). */
  tooFast: string
  /** A required field left empty (instead of the browser's own message in the phone's language). */
  required?: string
}

export function LeadForm({
  action,
  labels,
  courses,
  locale,
  sourcePage,
  defaultCourse,
}: {
  action: (prev: LeadState, form: FormData) => Promise<LeadState>
  labels: FormLabels
  courses: { id: number; name: string }[]
  locale: string
  sourcePage: string
  defaultCourse?: number
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false })
  const formId = useId()
  // How long the form was open before «send» (spam check in submitLead; never stored).
  const shownAt = useRef(0)
  const fillTime = useRef<HTMLInputElement>(null)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  // Speed: the «send» button's shimmer is repainted by the phone on every frame, even when the
  // form is far off-screen. Mark it while it's on screen; perf.css pauses it otherwise.
  const submitRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = submitRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) =>
      el.toggleAttribute('data-onscreen', e.isIntersecting),
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  // Conversion for statistics / ads (only if the visitor accepted cookies): once, on success,
  // with the course name only — never the name or phone.
  const courseName = useRef('')
  const tracked = useRef(false)
  useEffect(() => {
    if (state.ok && !tracked.current) {
      tracked.current = true
      trackLead(courseName.current)
    }
  }, [state.ok])
  const v = state.values
  const errId = `${formId}-err`
  // «Please fill out this field» comes in the language of the phone, not of the page.
  const required = {
    onInvalid: (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget
      if (labels.required && el.validity.valueMissing) el.setCustomValidity(labels.required)
    },
    onInput: (e: React.FormEvent<HTMLInputElement>) => e.currentTarget.setCustomValidity(''),
  }
  // A generic refusal is almost always a phone number the server did not accept.
  const phoneInvalid = Boolean(state.error && !state.reason)
  if (state.ok) {
    return (
      <div className="sent" role="status" ref={focusOnMount} tabIndex={-1}>
        <span className="check">
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3>{labels.successTitle}</h3>
        <p>{labels.successText}</p>
      </div>
    )
  }
  return (
    <form
      data-reveal=""
      action={formAction}
      onSubmit={(e) => {
        const course = e.currentTarget.elements.namedItem('course')
        courseName.current =
          course instanceof HTMLSelectElement && course.value
            ? (course.selectedOptions[0]?.text ?? '')
            : ''
        if (fillTime.current && shownAt.current)
          fillTime.current.value = String(Math.round(performance.now() - shownAt.current))
      }}
      className="form"
      style={{ ['--d' as string]: '120ms' }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ft" ref={fillTime} defaultValue="" />
      <input type="hidden" name="sourcePage" value={sourcePage} />
      <label className="sr-only" aria-hidden="true">
        website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-row">
        <label>
          <span>
            {labels.name} <i aria-hidden="true">*</i>
          </span>
          <input
            name="name"
            required
            {...required}
            maxLength={120}
            className="field"
            autoComplete="name"
            defaultValue={v?.name}
            aria-describedby={state.error ? errId : undefined}
          />
        </label>
        <label>
          <span>
            {labels.phone} <i aria-hidden="true">*</i>
          </span>
          <input
            name="phone"
            required
            {...required}
            type="tel"
            inputMode="tel"
            dir="ltr"
            maxLength={30}
            className="field"
            style={{ textAlign: 'start' }}
            autoComplete="tel"
            defaultValue={v?.phone}
            aria-invalid={phoneInvalid || undefined}
            aria-describedby={state.error ? errId : undefined}
          />
        </label>
      </div>
      <label>
        <span>{labels.course}</span>
        <select
          name="course"
          className="field"
          defaultValue={v ? v.course : defaultCourse ? String(defaultCourse) : ''}
        >
          <option value="">{labels.courseAny}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{labels.message}</span>
        <textarea
          name="message"
          rows={3}
          maxLength={2000}
          className="field"
          defaultValue={v?.message}
        />
      </label>
      {/* Marketing messages: a separate box, never pre-checked (חוק התקשורת סעיף 30א). */}
      <label className="consent-check">
        <input type="checkbox" name="marketing" value="yes" defaultChecked={v?.marketing} />
        <span>{labels.marketing}</span>
      </label>
      {state.error && (
        <p className="form-error" role="alert" id={errId}>
          {state.reason === 'rate_limited'
            ? labels.tooMany
            : state.reason === 'too_fast'
              ? labels.tooFast
              : labels.error}
        </p>
      )}
      <button
        ref={submitRef}
        type="submit"
        className="submit"
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {labels.submit}
      </button>
      {/* Privacy notice (section 11): shown before the visitor sends anything. */}
      <p className="privacy">
        {labels.privacy && <>{labels.privacy} </>}
        {labels.notice}
        {labels.privacyLink && (
          <>
            {' '}
            <a href={labels.privacyLink.href} style={{ textDecoration: 'underline' }}>
              {labels.privacyLink.label}
            </a>
          </>
        )}
      </p>
    </form>
  )
}

/** «עברית» / «العربية» — same page in the other language. */
export function LangSwitch({ locale, label }: { locale: string; label?: string | null }) {
  const path = usePathname() || `/${locale}`
  const other = locale === 'ar' ? 'he' : 'ar'
  const target = path.replace(/^\/(ar|he)(?=\/|$)/, `/${other}`)
  return (
    <a
      className="icon-btn"
      href={target === path ? `/${other}` : target}
      hrefLang={other}
      lang={other}
      // Same section in the other language too (/ar#faq → /he#faq); the #… is only known here.
      onClick={(e) => {
        e.currentTarget.hash = location.hash
      }}
    >
      {label}
    </a>
  )
}

/**
 * Google map on the contact page. Loaded only when the visitor asks for it: Google Maps sets
 * cookies and is heavy, so until the click there is just a button (same idea as the videos).
 */
export function MapEmbed({
  src,
  title,
  showLabel,
}: {
  src: string
  title: string
  showLabel: string
}) {
  const [shown, setShown] = useState(false)
  if (shown) {
    return (
      <iframe
        ref={focusOnMount}
        className="map-frame"
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    )
  }
  return (
    <button type="button" className="map-frame map-placeholder" onClick={() => setShown(true)}>
      <span className="btn btn-green">{showLabel}</span>
    </button>
  )
}

/** «اطبع / احفظ PDF» on a course page — the browser's print window can save the page as PDF. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-outline print-btn" onClick={() => window.print()}>
      {label}
    </button>
  )
}
