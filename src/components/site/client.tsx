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

/** Visitor asked the device for less motion (no auto-rotation, no smooth scrolling). */
const noSubscribe = () => () => {}
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Ref callback: move the keyboard focus to an element that just replaced the button the visitor
 * pressed (video player, YouTube frame, «thank you» message) — otherwise focus falls to the page top.
 */
const focusOnMount = (el: HTMLElement | null) => el?.focus({ preventScroll: true })

/** Adds `.is-in` to [data-reveal] elements when they scroll into view. */
export function RevealObserver() {
  useEffect(() => {
    document.documentElement.classList.remove('no-js')
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    )
    const scan = () =>
      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
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

type MenuLink = { href: string; label: string }

export function HeaderMenu({
  links,
  registerHref,
  registerLabel,
  whatsappHref,
  whatsappLabel,
  menuLabel,
  navLabel,
}: {
  links: MenuLink[]
  registerHref: string
  registerLabel: string
  whatsappHref: string
  whatsappLabel: string
  menuLabel: string
  /** Name of the menu's <nav> for screen readers. */
  navLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const close = () => setOpen(false)
  // Esc closes the menu and puts the keyboard focus back on the menu button.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
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
        <div className="glass menu-panel" id="site-menu">
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
  quote: string
  body?: string | null
  now?: string | null
  courseName?: string | null
  image?: string
  video?: string
  dur?: string | null
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
  const reduced = useSyncExternalStore(noSubscribe, reducedMotion, () => false)
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
        <p className="story-quote">“{s.quote}”</p>
        {s.body && <p className="story-body">{s.body}</p>}
        <div className="story-who">
          {s.image && <img src={s.image} alt="" decoding="async" />}
          <div>
            <b>{s.name}</b>
            {s.now && <small>{s.now}</small>}
          </div>
        </div>
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
      <div className="zoom story-photo" key={`p${s.id}`}>
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

export function StaffBio({
  bio,
  more,
  less,
  tabIndex,
}: {
  bio: string
  more: string
  less: string
  /** -1 on the hidden copies of the moving strip (keyboard skips them). */
  tabIndex?: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p className={`staff-bio${open ? ' open' : ''}`}>{bio}</p>
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

export function Faq({ items }: { items: { question: string; answer: string }[] }) {
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                <p className="faq-a">{f.answer}</p>
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
  privacy: string
  /** Link to the privacy policy page, shown after the privacy sentence. */
  privacyLink?: { href: string; label: string }
  successTitle: string
  successText: string
  error: string
  /** Same visitor sent too many forms in a short time. */
  tooMany: string
  /** «Send» pressed a moment after the form appeared (typical of bots). */
  tooFast: string
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
      <p className="privacy">
        {labels.privacy}
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
    >
      {label}
    </a>
  )
}
