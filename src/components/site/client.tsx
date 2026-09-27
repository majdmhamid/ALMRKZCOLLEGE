'use client'

import { usePathname } from 'next/navigation'
import React, { useActionState, useEffect, useRef, useState } from 'react'

import type { LeadState } from './actions'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloseIcon,
  MenuIcon,
  PlayIcon,
  PlusIcon,
  WhatsAppIcon,
} from './icons'

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
}: {
  links: MenuLink[]
  registerHref: string
  registerLabel: string
  whatsappHref: string
  whatsappLabel: string
  menuLabel: string
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      <button
        className="icon-btn square"
        aria-label={menuLabel}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div className="glass menu-panel">
          <nav>
            {links.map((m, i) => (
              <a key={m.href + i} href={m.href} onClick={close}>
                <span>{m.label}</span>
                <small>{String(i + 1).padStart(2, '0')}</small>
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
}: {
  children: React.ReactNode
  hint?: string | null
  header: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' })
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
          <button className="round-btn" aria-label="prev" onClick={() => move(1)}>
            <ChevronRight />
          </button>
          <button className="round-btn solid" aria-label="next" onClick={() => move(-1)}>
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
  return <span ref={ref}>{shown}</span>
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
}: {
  stories: StoryView[]
  videoLabel?: string | null
  rotateSeconds: number
}) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const ticks = useRef(0)
  useEffect(() => {
    ticks.current = 0
    if (stories.length < 2) return
    const iv = setInterval(() => {
      if (playing) return
      ticks.current += 1
      if (ticks.current * 500 < rotateSeconds * 1000) return
      ticks.current = 0
      setI((x) => (x + 1) % stories.length)
    }, 500)
    return () => clearInterval(iv)
  }, [stories.length, rotateSeconds, playing])
  const s = stories[i]
  if (!s) return null
  const pick = (n: number) => {
    ticks.current = 0
    setPlaying(false)
    setI(n)
  }
  return (
    <div data-reveal="" className="stories">
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
        </div>
      </div>
      <div className="zoom story-photo" key={`p${s.id}`}>
        {playing && s.video ? (
          <video
            src={s.video}
            controls
            autoPlay
            playsInline
            className="cover"
            style={{ background: '#000' }}
          />
        ) : (
          <>
            {s.image && <img src={s.image} alt={s.name} className="cover" decoding="async" />}
            <div
              className="shade-bottom"
              style={{ background: 'linear-gradient(to top,rgba(5,38,19,.8),rgba(5,38,19,0) 55%)' }}
            />
            {s.video && (
              <button className="play ring" aria-label={s.name} onClick={() => setPlaying(true)}>
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

export function StaffBio({ bio, more, less }: { bio: string; more: string; less: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p className={`staff-bio${open ? ' open' : ''}`}>{bio}</p>
      <button className="small-btn" onClick={() => setOpen(!open)}>
        {open ? less : more}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
    </>
  )
}

export function PromoStage({
  video,
  youtubeId,
  children,
  playLabel,
}: {
  video?: string
  youtubeId?: string
  children: React.ReactNode
  playLabel?: string | null
}) {
  const [playing, setPlaying] = useState(false)
  if (playing && youtubeId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={playLabel ?? 'video'}
      />
    )
  }
  if (playing && video) return <video src={video} controls autoPlay playsInline />
  return (
    <button className="stage-btn" aria-label={playLabel ?? 'play'} onClick={() => setPlaying(true)}>
      {children}
    </button>
  )
}

export function Reel({ video, children }: { video?: string; children: React.ReactNode }) {
  const [playing, setPlaying] = useState(false)
  if (playing && video) {
    return (
      <div className="reel-media">
        <video src={video} controls autoPlay playsInline />
      </div>
    )
  }
  return (
    <div className="lift zoom reel-media" onClick={() => video && setPlaying(true)}>
      {children}
    </div>
  )
}

export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0)
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
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                {f.question}
              </span>
              <span className="faq-ic">
                <PlusIcon />
              </span>
            </button>
            <div className="faq-body" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
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
  successTitle: string
  successText: string
  error: string
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
  if (state.ok) {
    return (
      <div className="sent">
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
      className="form"
      style={{ ['--d' as string]: '120ms' }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="sourcePage" value={sourcePage} />
      <label className="sr-only" aria-hidden="true">
        website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-row">
        <label>
          <span>
            {labels.name} <i>*</i>
          </span>
          <input name="name" required maxLength={120} className="field" autoComplete="name" />
        </label>
        <label>
          <span>
            {labels.phone} <i>*</i>
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
          />
        </label>
      </div>
      <label>
        <span>{labels.course}</span>
        <select
          name="course"
          className="field"
          defaultValue={defaultCourse ? String(defaultCourse) : ''}
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
        <textarea name="message" rows={3} maxLength={2000} className="field" />
      </label>
      {state.error && <p className="form-error">{labels.error}</p>}
      <button type="submit" className="submit" disabled={pending}>
        {labels.submit}
      </button>
      <p className="privacy">{labels.privacy}</p>
    </form>
  )
}

/** «עברית» / «العربية» — same page in the other language. */
export function LangSwitch({ locale, label }: { locale: string; label?: string | null }) {
  const path = usePathname() || `/${locale}`
  const other = locale === 'ar' ? 'he' : 'ar'
  const target = path.replace(/^\/(ar|he)(?=\/|$)/, `/${other}`)
  return (
    <a className="icon-btn" href={target === path ? `/${other}` : target} hrefLang={other}>
      {label}
    </a>
  )
}
