import React from 'react'

import type { Course, CourseGroup, Homepage, Media, SuccessStory } from '@/payload-types'
import { VOUCHER_TEXT, type SiteLocale } from '@/lib/rules'

import { submitLead } from './actions'
import {
  Carousel,
  CountUp,
  Faq,
  LeadForm,
  PromoStage,
  Reel,
  StaffBio,
  Stories,
  type FormLabels,
  type StoryView,
} from './client'
import {
  type Shared,
  asDoc,
  courseHref,
  formatDate,
  groupHref,
  mediaAlt,
  mediaDims,
  mediaUrl,
  whatsappHref,
} from './data'
import { A11Y } from './a11y-text'
import { HeroVideo } from './hero-video'
import { LEGAL_LABELS, legalHref } from './legal-links'
import type { getHomeData } from './data'
import { ArrowIcon, CheckIcon, ChevronDown, PlayIcon, WhatsAppIcon } from './icons'

type Home = Awaited<ReturnType<typeof getHomeData>>
type Section = NonNullable<Homepage['sections']>[number]
type Ctx = { shared: Shared; home: Home; locale: SiteLocale; n?: string }

const delay = (i: number, step: number) =>
  ({ ['--d' as string]: `${i * step}ms` }) as React.CSSProperties
const nn = (i: number) => String(i + 1).padStart(2, '0')

export function Kicker({
  n,
  label,
  center,
}: {
  n?: string
  label?: string | null
  center?: boolean
}) {
  if (!label) return null
  return (
    <div className={`kicker${center ? ' center' : ''}`}>
      {center && <span className="line" aria-hidden="true" />}
      {n && <span aria-hidden="true">{n}</span>}
      {!center && <span className="line" aria-hidden="true" />}
      <span className="label">{label}</span>
      {center && <span className="line" aria-hidden="true" />}
    </div>
  )
}

/** Published courses of a group. */
const coursesOf = (shared: Shared, g: CourseGroup) =>
  shared.courses.filter((c) => (asDoc(c.group)?.id ?? c.group) === g.id)

const countLabel = (shared: Shared, g: CourseGroup) => {
  const n = coursesOf(shared, g).length
  return n ? `${n} ${shared.ui.common?.courseCount ?? ''}` : ''
}

export function CourseCard({
  c,
  shared,
  locale,
  i = 0,
  eager = false,
}: {
  c: Course
  shared: Shared
  locale: SiteLocale
  i?: number
  /** In a horizontal carousel the side cards must load right away (no pop-in while swiping). */
  eager?: boolean
}) {
  const ui = shared.ui
  const img = mediaUrl(c.coverImage, 'card')
  const group = asDoc(c.group)
  return (
    <article data-reveal="" className="glass lift zoom course-card" style={delay(i, 90)}>
      <a href={courseHref(locale, c)} className="course-media" style={{ display: 'block' }}>
        {img && (
          <img
            src={img}
            alt={mediaAlt(c.coverImage)}
            className="cover"
            loading={eager ? undefined : 'lazy'}
            decoding="async"
          />
        )}
        {group && <span className="tag">{group.name}</span>}
      </a>
      <div className="course-body">
        <h3>
          <a href={courseHref(locale, c)}>{c.name}</a>
        </h3>
        <p className="sum">{c.shortDescription}</p>
        {Boolean(c.hours || c.sessions) && (
          <div className="facts3">
            <div>
              <b dir="ltr">{c.hours ?? '—'}</b>
              {ui.common?.hours}
            </div>
            <div>
              <b dir="ltr">{c.sessions ?? '—'}</b>
              {ui.common?.sessions}
            </div>
            <div>
              {c.scheduleDetails && !c.schedule?.includes('evening')
                ? c.scheduleDetails
                : ui.common?.evening}
            </div>
          </div>
        )}
        <div className="course-foot">
          <span>
            {c.voucherEligible && <span className="voucher-dot">{ui.trust?.[3]?.title}</span>}
          </span>
          <a href={courseHref(locale, c)} className="btn btn-green">
            {ui.common?.viewCourse}
          </a>
        </div>
      </div>
    </article>
  )
}

function Hero({ b, shared, locale }: { b: Extract<Section, { blockType: 'hero' }> } & Ctx) {
  const poster = mediaUrl(b.poster, 'hero')
  const video = mediaUrl(b.video)
  const logo = mediaUrl(shared.settings.logoDark)
  const loop = [...shared.groups, ...shared.groups, ...shared.groups, ...shared.groups]
  return (
    <section id={b.anchor || 'top'} className="hero">
      <div className="hero-bg" aria-hidden="true">
        {poster && (
          <img src={poster} alt="" className="cover poster" fetchPriority="high" decoding="async" />
        )}
        {video && <HeroVideo src={video} poster={poster} />}
        <div className="hero-shade" />
        <div className="hero-dots" />
        <div className="hero-scan" />
      </div>
      <div className="hero-inner">
        <div>
          {logo && (
            <img
              src={logo}
              alt={shared.settings.siteName ?? ''}
              className="hero-logo"
              {...mediaDims(shared.settings.logoDark)}
            />
          )}
          {b.badge && (
            <div>
              <span className="hero-badge">
                <span className="dot" />
                {b.badge}
              </span>
            </div>
          )}
          <h1>{b.title}</h1>
          {b.kicker && <p className="hero-kicker">{b.kicker}</p>}
          {b.text && <p className="hero-text">{b.text}</p>}
          <div className="hero-ctas">
            <a
              href={whatsappHref(shared)}
              target="_blank"
              rel="noopener"
              className="btn btn-wa ring"
            >
              <WhatsAppIcon />
              {b.whatsappButton}
            </a>
            <a href="#register" className="btn btn-glass">
              {b.registerButton}
            </a>
          </div>
          {b.coursesLink && (
            <a href="#fields" className="hero-courses">
              {b.coursesLink}
              <ArrowIcon />
            </a>
          )}
        </div>
      </div>
      {b.showGroupsStrip !== false && shared.groups.length > 0 && (
        <div dir="ltr" className="hero-strip">
          <div className="hero-strip-band">
            <div className="hero-strip-track">
              {loop.map((g, i) => {
                const icon = mediaUrl(g.icon)
                const cl = countLabel(shared, g)
                return (
                  <a
                    key={i}
                    href={groupHref(locale, g)}
                    dir="rtl"
                    className="chip"
                    aria-hidden={i >= shared.groups.length || undefined}
                    tabIndex={i >= shared.groups.length ? -1 : undefined}
                  >
                    <span className="ic">
                      {icon && <img src={icon} alt="" width={24} height={24} decoding="async" />}
                    </span>
                    <span className="nm">{g.name}</span>
                    {cl && <span className="ct">{cl}</span>}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {b.scrollHint && (
        <a href="#stats" className="hero-scroll" aria-label={b.scrollHint}>
          <span>{b.scrollHint}</span>
          <ChevronDown />
        </a>
      )}
    </section>
  )
}

function Stats({ b }: { b: Extract<Section, { blockType: 'stats' }> } & Ctx) {
  return (
    <section id={b.anchor || 'stats'} className="stats">
      <div className="glass stats-box">
        {(b.items ?? []).map((s) => (
          <a key={s.id} href={s.anchor ? `#${s.anchor}` : '#'}>
            <span dir="ltr" className="stat-num">
              <CountUp value={s.value} />
              <span>{s.suffix}</span>
            </span>
            <span className="stat-label">{s.label}</span>
            <ArrowIcon size={18} color="#5dac32" className="arrow show-desktop" />
          </a>
        ))}
      </div>
    </section>
  )
}

function Groups({
  b,
  shared,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'courseGroups' }> } & Ctx) {
  const chosen = (b.groups ?? []).map((g) => asDoc(g)).filter(Boolean) as CourseGroup[]
  const groups = chosen.length ? chosen : shared.groups
  return (
    <section id={b.anchor || 'fields'} className="sec" style={{ padding: '72px 20px 24px' }}>
      <div className="wrap">
        <Carousel
          prevLabel={A11Y[locale].prev}
          nextLabel={A11Y[locale].next}
          hint={b.swipeHint}
          header={
            <div>
              <Kicker n={n} label={b.kicker} />
              <h2 className="h2">{b.title}</h2>
              {b.subtitle && <p className="lead">{b.subtitle}</p>}
            </div>
          }
        >
          {groups.map((g, i) => {
            const img = mediaUrl(g.image, 'card')
            const icon = mediaUrl(g.icon)
            const cl = countLabel(shared, g)
            return (
              <a
                key={g.id}
                href={groupHref(locale, g)}
                data-reveal=""
                className="glass lift zoom field-card"
                style={delay(i, 120)}
              >
                <div className="field-media">
                  {img && (
                    <img src={img} alt={mediaAlt(g.image)} className="cover" decoding="async" />
                  )}
                  <div className="shade-bottom" />
                  <span className="pill-white">{nn(i)}</span>
                  {cl && <span className="pill-glass">{cl}</span>}
                </div>
                <div className="field-body">
                  <span className="field-icon">
                    {icon && <img src={icon} alt="" width={36} height={36} decoding="async" />}
                  </span>
                  <span style={{ flex: 1 }}>
                    <h3>{g.name}</h3>
                    {g.tagline && <p>{g.tagline}</p>}
                  </span>
                  <ArrowIcon size={22} color="#158942" style={{ marginTop: 6 }} />
                </div>
              </a>
            )
          })}
        </Carousel>
      </div>
    </section>
  )
}

function Featured({
  b,
  shared,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'featuredCourses' }> } & Ctx) {
  const chosen = (b.courses ?? []).map((c) => asDoc(c)).filter(Boolean) as Course[]
  const courses = chosen.length ? chosen : shared.courses.filter((c) => c.featured)
  return (
    <section id={b.anchor || 'courses'} className="sec">
      <div className="wrap">
        <div data-reveal="" className="section-head" style={{ marginBottom: 24 }}>
          <div>
            <Kicker n={n} label={b.kicker} />
            <h2 className="h2">{b.title}</h2>
          </div>
          {b.allCoursesButton && (
            <a href={`/${locale}/courses`} className="btn btn-outline">
              {b.allCoursesButton}
              <ArrowIcon />
            </a>
          )}
        </div>
        <div className="snap">
          {courses.map((c, i) => (
            <CourseCard key={c.id} c={c} shared={shared} locale={locale} i={i} eager />
          ))}
        </div>
        <p className="swipe-note show-mobile">← {shared.ui.common?.swipe} →</p>
      </div>
    </section>
  )
}

function Why({ b, n }: { b: Extract<Section, { blockType: 'why' }> } & Ctx) {
  const img = mediaUrl(b.image, 'wide')
  return (
    <section id={b.anchor || 'why'} className="sec">
      <div className="why-grid">
        <div>
          <div data-reveal="">
            <Kicker n={n} label={b.kicker} />
          </div>
          <h2 data-reveal="" className="h2">
            {b.title}
          </h2>
          <ol className="steps">
            {(b.items ?? []).map((w, i) => (
              <li key={w.id} data-reveal="x" style={delay(i, 110)}>
                <span className="num">{nn(i)}</span>
                <div className="glass">
                  <h3>{w.title}</h3>
                  {w.text && <p>{w.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal="" style={{ position: 'relative' }}>
          <div className="zoom why-photo">
            {img && (
              <img
                src={img}
                alt={mediaAlt(b.image)}
                className="cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="shade" />
            <div className="why-pills">
              {(b.pills ?? []).map((p) => (
                <span key={p.id}>{p.text}</span>
              ))}
            </div>
          </div>
          {b.badgeNumber && (
            <div className="glass why-badge">
              <p dir="ltr" className="n">
                {b.badgeNumber}
              </p>
              {b.badgeText && <p className="t">{b.badgeText}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function StoriesSection({
  b,
  home,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'successStories' }> } & Ctx) {
  const chosen = (b.stories ?? []).map((s) => asDoc(s)).filter(Boolean) as SuccessStory[]
  const list = (chosen.length ? chosen : home.stories.filter((s) => s.featured)).filter(
    (s) => s.quote,
  )
  if (!list.length) return null
  const stories: StoryView[] = list.map((s) => ({
    id: s.id,
    name: s.graduateName,
    quote: s.quote!,
    body: s.excerpt,
    now: s.currentRole,
    courseName: asDoc(s.course)?.name,
    image: mediaUrl(s.photo, 'wide'),
    video: mediaUrl(s.video),
    dur: s.videoDuration,
  }))
  return (
    <section
      id={b.anchor || 'graduates'}
      className="sec"
      style={{ padding: '56px 0', overflow: 'hidden' }}
    >
      <div className="wrap" style={{ padding: '0 20px' }}>
        <div data-reveal="" className="section-head center">
          <Kicker n={n} label={b.kicker} center />
          <h2 className="h2">{b.title}</h2>
          {b.subtitle && <p className="lead">{b.subtitle}</p>}
        </div>
        <Stories
          stories={stories}
          videoLabel={b.videoLabel}
          rotateSeconds={b.rotateSeconds ?? 6.5}
          labels={{
            play: A11Y[locale].play,
            pause: A11Y[locale].pauseRotation,
            resume: A11Y[locale].resumeRotation,
          }}
        />
      </div>
    </section>
  )
}

function StaffSection({
  b,
  shared,
  home,
  n,
}: { b: Extract<Section, { blockType: 'staff' }> } & Ctx) {
  const chosen = (b.members ?? []).map((s) => asDoc(s)).filter(Boolean) as typeof home.staff
  const staff = chosen.length ? chosen : home.staff
  if (!staff.length) return null
  const loop = [...staff, ...staff]
  return (
    <section id={b.anchor || 'staff'} className="staff-sec">
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div data-reveal="" className="section-head center" style={{ marginBottom: 30 }}>
          <Kicker n={n} label={b.kicker} center />
          <h2 className="h2">{b.title}</h2>
          {b.subtitle && <p className="lead">{b.subtitle}</p>}
        </div>
      </div>
      <div className="mqwrap marquee" dir="ltr">
        <div className="mqtrack staff-track">
          {loop.map((s, i) => (
            <article
              key={i}
              dir="rtl"
              className="staff-card"
              aria-hidden={i >= staff.length || undefined}
            >
              <div className="staff-photo">
                {mediaUrl(s.photo, 'card') && (
                  <img src={mediaUrl(s.photo, 'card')} alt="" decoding="async" />
                )}
              </div>
              <div className="staff-info">
                <h3>{s.name}</h3>
                <p className="staff-role">{s.role}</p>
                {s.bio && (
                  <StaffBio
                    bio={s.bio}
                    more={shared.ui.common?.readMore ?? ''}
                    less={shared.ui.nav?.close ?? ''}
                    tabIndex={i >= staff.length ? -1 : undefined}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const youtubeId = (url?: string | null) =>
  url?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? undefined

function Videos({ b, shared, locale, n }: { b: Extract<Section, { blockType: 'videos' }> } & Ctx) {
  const promo = b.promo
  const poster = mediaUrl(promo?.poster, 'wide')
  return (
    <section id={b.anchor || 'video'} className="videos-sec">
      <div className="orbs" aria-hidden="true">
        <div className="a" />
        <div className="b" />
        <div className="c" />
        <div className="d" />
      </div>
      <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto' }}>
        <div data-reveal="" className="section-head center" style={{ marginBottom: 28 }}>
          <Kicker n={n} label={b.kicker} center />
          <h2 className="h2">{b.title}</h2>
          {b.subtitle && <p className="lead">{b.subtitle}</p>}
        </div>
        {(promo?.video || promo?.youtubeUrl || poster) && (
          <div data-reveal="" className="stage-frame">
            <div className="lift stage">
              <PromoStage
                video={mediaUrl(promo?.video)}
                youtubeId={youtubeId(promo?.youtubeUrl)}
                playLabel={promo?.playLabel || A11Y[locale].play}
                title={promo?.title}
              >
                {poster && (
                  <img src={poster} alt="" className="cover" loading="lazy" decoding="async" />
                )}
                <div className="stage-shade" />
                <span className="play ring">
                  <PlayIcon size={38} />
                </span>
                {promo?.durationLabel && (
                  <span dir="ltr" className="dur stage-dur">
                    {promo.durationLabel}
                  </span>
                )}
                <div className="stage-cap">
                  {promo?.kind && <small>{promo.kind}</small>}
                  {promo?.title && <p className="t">{promo.title}</p>}
                  {promo?.subtitle && <p className="s">{promo.subtitle}</p>}
                </div>
              </PromoStage>
            </div>
          </div>
        )}
        {(b.reels ?? []).length > 0 && (
          <div className="reels">
            {(b.reels ?? []).map((r, i) => {
              const course = asDoc(r.course)
              const img = mediaUrl(r.poster, 'card')
              // Play button and duration only when there is a video to play.
              const video = mediaUrl(r.video)
              return (
                <div key={r.id} data-reveal="" className="reel" style={delay(i, 80)}>
                  <Reel video={video} label={`${A11Y[locale].play}: ${r.title}`}>
                    {img && (
                      <img src={img} alt="" className="cover" loading="lazy" decoding="async" />
                    )}
                    <div className="shade" />
                    {video && (
                      <span className="play ring">
                        <PlayIcon size={26} />
                      </span>
                    )}
                    {video && r.durationLabel && (
                      <span dir="ltr" className="dur">
                        {r.durationLabel}
                      </span>
                    )}
                    {course && asDoc(course.group) && (
                      <span className="grp">{asDoc(course.group)!.name}</span>
                    )}
                    <p className="t">{r.title}</p>
                  </Reel>
                  <a
                    href={whatsappHref(shared, `${b.whatsappMessage ?? ''}${course?.name ?? ''}`)}
                    target="_blank"
                    rel="noopener"
                    className="reel-link"
                  >
                    {shared.ui.common?.viewCourse}
                    <ArrowIcon />
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function NewsSection({
  b,
  shared,
  home,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'news' }> } & Ctx) {
  const items = home.news.slice(0, b.count ?? 3)
  if (!items.length) return null
  return (
    <section id={b.anchor || 'news'} className="sec" style={{ padding: '36px 20px 56px' }}>
      <div className="wrap">
        <div data-reveal="" className="section-head" style={{ marginBottom: 24 }}>
          <div>
            <Kicker n={n} label={b.kicker} />
            <h2 className="h2">{b.title}</h2>
          </div>
        </div>
        <div className="news-grid">
          {items.map((x, i) => {
            const img = mediaUrl(x.coverImage, 'card')
            return (
              <a
                key={x.id}
                href={`/${locale}/news/${x.slug}`}
                data-reveal=""
                className="glass lift zoom news-card"
                style={delay(i, 100)}
              >
                <div className="course-media">
                  {img && (
                    <img
                      src={img}
                      alt={mediaAlt(x.coverImage)}
                      className="cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <time className="tag" dateTime={x.publishedAt}>
                    {formatDate(x.publishedAt, locale)}
                  </time>
                </div>
                <div className="course-body" style={{ gap: 8 }}>
                  <h3>{x.title}</h3>
                  {x.excerpt && <p className="ex">{x.excerpt}</p>}
                  <span className="more">
                    {shared.ui.common?.readMore}
                    <ArrowIcon />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Partners({ b, home }: { b: Extract<Section, { blockType: 'partners' }> } & Ctx) {
  const chosen = (b.partners ?? []).map((p) => asDoc(p)).filter(Boolean) as typeof home.partners
  const partners = chosen.length ? chosen : home.partners
  if (!partners.length) return null
  return (
    <section id={b.anchor || 'partners'} className="partners-sec">
      <p data-reveal="" className="partners-title">
        {b.title}
      </p>
      <div
        dir="ltr"
        style={{
          overflow: 'hidden',
          maskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)',
        }}
      >
        <div className="partners-track">
          {[...partners, ...partners].map((p, i) => {
            const logo = mediaUrl(p.logo as Media)
            const img = logo && (
              <img
                src={logo}
                alt={p.name}
                title={p.name}
                {...mediaDims(p.logo as Media)}
                decoding="async"
              />
            )
            return (
              <div key={i} className="partner" aria-hidden={i >= partners.length || undefined}>
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener"
                    tabIndex={i >= partners.length ? -1 : undefined}
                    style={{ height: '100%', display: 'flex' }}
                  >
                    {img}
                  </a>
                ) : (
                  img
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Employers({ b, shared, n }: { b: Extract<Section, { blockType: 'employers' }> } & Ctx) {
  return (
    <section id={b.anchor || 'employers'} className="sec" style={{ padding: '0 20px 56px' }}>
      <div data-reveal="" className="emp">
        <div className="dots" aria-hidden="true" />
        <div className="glow" aria-hidden="true" />
        <div className="emp-inner">
          <div>
            <Kicker n={n} label={b.kicker} />
            <h2 className="h2">{b.title}</h2>
            {b.text && <p className="emp-text">{b.text}</p>}
            <div className="emp-btns">
              {b.whatsappButton && (
                <a
                  href={whatsappHref(shared)}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-white"
                >
                  <WhatsAppIcon size={20} color="#25d366" />
                  {b.whatsappButton}
                </a>
              )}
              {b.hiringButton && (
                <a href="#register" className="btn btn-line" title={b.hiringText ?? undefined}>
                  {b.hiringButton}
                </a>
              )}
            </div>
          </div>
          <div className="emp-items">
            {(b.items ?? []).map((e, i) => (
              <div key={e.id} data-reveal="" className="emp-item" style={delay(i, 90)}>
                <small>{nn(i)}</small>
                <h3>{e.title}</h3>
                {e.text && <p>{e.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection({ b, n }: { b: Extract<Section, { blockType: 'faq' }> } & Ctx) {
  return (
    <section id={b.anchor || 'faq'} className="sec" style={{ padding: '0 20px 56px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div data-reveal="" style={{ textAlign: 'center', marginBottom: 22 }}>
          <Kicker n={n} label={b.kicker} center />
          <h2 className="h2">{b.title}</h2>
          {b.text && <p style={{ marginTop: 8, fontSize: 16, color: '#4b5c61' }}>{b.text}</p>}
        </div>
        <Faq items={(b.items ?? []).map((f) => ({ question: f.question, answer: f.answer }))} />
      </div>
    </section>
  )
}

export function formLabels(shared: Shared, locale: SiteLocale): FormLabels {
  const f = shared.ui.form
  return {
    name: f?.name ?? '',
    phone: f?.phone ?? '',
    course: f?.course ?? '',
    courseAny: f?.courseAny ?? '',
    message: f?.message ?? '',
    submit: f?.submit ?? '',
    privacy: f?.privacy ?? '',
    privacyLink: { href: legalHref(locale, 'privacy'), label: LEGAL_LABELS[locale].privacy },
    successTitle: f?.successTitle ?? '',
    successText: f?.successText ?? '',
    error:
      f?.error ??
      (locale === 'he'
        ? 'משהו השתבש. בדקו את מספר הטלפון ונסו שוב, או כתבו לנו בוואטסאפ.'
        : 'صار خطأ. تأكد من رقم الهاتف وحاول مرة ثانية، أو راسلنا على واتساب.'),
    tooMany:
      locale === 'he'
        ? 'קיבלנו כמה פניות מהמכשיר הזה בזמן קצר. נסו שוב בעוד כמה דקות, או כתבו לנו בוואטסאפ.'
        : 'وصلنا كذا طلب من هذا الجهاز بوقت قصير. جرّب كمان كم دقيقة، أو راسلنا على واتساب.',
    tooFast:
      locale === 'he'
        ? 'רגע אחד… בדקו את הפרטים ולחצו שוב על שליחה.'
        : 'لحظة… تأكد من التفاصيل واضغط إرسال مرة ثانية.',
  }
}

export function RegisterForm({
  shared,
  locale,
  source,
  defaultCourse,
}: {
  shared: Shared
  locale: SiteLocale
  source: string
  defaultCourse?: number
}) {
  return (
    <LeadForm
      action={submitLead}
      labels={formLabels(shared, locale)}
      courses={shared.courses.map((c) => ({ id: c.id, name: c.name }))}
      locale={locale}
      sourcePage={source}
      defaultCourse={defaultCourse}
    />
  )
}

function Register({
  b,
  shared,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'register' }> } & Ctx) {
  const lines = [
    ...(b.showVoucherNote !== false ? [VOUCHER_TEXT[locale]] : []),
    ...(b.bullets ?? []).map((x) => x.text),
  ]
  const mobile = shared.settings.contact?.phones?.[1]?.number
  return (
    <section id={b.anchor || 'register'} className="sec" style={{ padding: '0 20px 72px' }}>
      <div className="glass reg">
        <div className="glow" aria-hidden="true" />
        <div data-reveal="" style={{ position: 'relative' }}>
          <Kicker n={n} label={b.kicker} />
          <h2>{b.title}</h2>
          {b.text && (
            <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, color: '#4b5c61' }}>
              {b.text}
            </p>
          )}
          <ul className="checks">
            {lines.map((t, i) => (
              <li key={i}>
                <span className="check">
                  <CheckIcon />
                </span>
                {t}
              </li>
            ))}
          </ul>
          {b.whatsappButton && (
            <a
              href={whatsappHref(shared)}
              target="_blank"
              rel="noopener"
              className="btn btn-wa reg-wa"
            >
              <WhatsAppIcon />
              {b.whatsappButton}
              {mobile && (
                <>
                  {' · '}
                  <span dir="ltr">{mobile}</span>
                </>
              )}
            </a>
          )}
        </div>
        <RegisterForm shared={shared} locale={locale} source={`/${locale}`} />
      </div>
    </section>
  )
}

function GallerySection({
  b,
  home,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'gallery' }> } & Ctx) {
  const imgs = (home.gallery.images ?? [])
    .map((m) => asDoc(m as Media))
    .filter(Boolean)
    .slice(0, b.count ?? 10) as Media[]
  const videos = (home.gallery.videos ?? [])
    .map((v) => {
      const yt = youtubeId(v.youtubeUrl)
      const file = yt ? undefined : mediaUrl(v.file)
      const thumb =
        mediaUrl(v.thumbnail, 'card') ?? (yt && `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`)
      return { id: v.id ?? v.title, title: v.title, yt, file, thumb, dims: mediaDims(v.thumbnail) }
    })
    .filter((v) => v.yt || v.file)
  if (!imgs.length && !videos.length) return null
  return (
    <section id={b.anchor || 'gallery'} className="sec">
      <div className="wrap">
        <div data-reveal="" className="section-head center">
          <Kicker n={n} label={b.kicker} center />
          <h2 className="h2">{b.title}</h2>
          {b.subtitle && <p className="lead">{b.subtitle}</p>}
        </div>
        {videos.length > 0 && (
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              marginBottom: imgs.length ? 14 : 0,
            }}
          >
            {videos.map((v, i) => (
              <div key={v.id} data-reveal="" className="lift stage" style={delay(i, 80)}>
                {v.yt ? (
                  <PromoStage
                    youtubeId={v.yt}
                    playLabel={`${locale === 'he' ? 'נגן' : 'تشغيل'}: ${v.title}`}
                    title={v.title}
                  >
                    {v.thumb && (
                      <img
                        src={v.thumb}
                        alt=""
                        className="cover"
                        loading="lazy"
                        decoding="async"
                        {...v.dims}
                      />
                    )}
                    <div className="stage-shade" />
                    {/* smaller than the big promo: these cards are half-width / phone-width */}
                    <span className="play ring" style={{ width: 60, height: 60 }}>
                      <PlayIcon size={26} />
                    </span>
                    <div className="stage-cap">
                      <p className="t" style={{ fontSize: 'clamp(15px, 1.7vw, 22px)' }}>
                        {v.title}
                      </p>
                    </div>
                  </PromoStage>
                ) : (
                  <video
                    src={v.file}
                    poster={v.thumb || undefined}
                    controls
                    preload="none"
                    playsInline
                    title={v.title}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {imgs.length > 0 && (
          <div className="gallery-grid">
            {imgs.map((m, i) => (
              <img
                key={m.id}
                data-reveal=""
                style={delay(i, 50)}
                src={mediaUrl(m, 'card')}
                alt={m.alt}
                loading="lazy"
                decoding="async"
                {...mediaDims(m)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

const UNNUMBERED = new Set(['hero', 'stats', 'partners'])

/** Renders the homepage sections in the order the editors chose. */
export function HomeSections({ shared, home, locale }: Omit<Ctx, 'n'>) {
  const sections = (home.homepage.sections ?? []).filter((s) => !s.hidden)
  let counter = 0
  return (
    <>
      {sections.map((b) => {
        const n = UNNUMBERED.has(b.blockType) ? undefined : nn(counter++)
        const ctx = { shared, home, locale, n }
        switch (b.blockType) {
          case 'hero':
            return <Hero key={b.id} b={b} {...ctx} />
          case 'stats':
            return <Stats key={b.id} b={b} {...ctx} />
          case 'courseGroups':
            return <Groups key={b.id} b={b} {...ctx} />
          case 'featuredCourses':
            return <Featured key={b.id} b={b} {...ctx} />
          case 'why':
            return <Why key={b.id} b={b} {...ctx} />
          case 'successStories':
            return <StoriesSection key={b.id} b={b} {...ctx} />
          case 'staff':
            return <StaffSection key={b.id} b={b} {...ctx} />
          case 'videos':
            return <Videos key={b.id} b={b} {...ctx} />
          case 'news':
            return <NewsSection key={b.id} b={b} {...ctx} />
          case 'partners':
            return <Partners key={b.id} b={b} {...ctx} />
          case 'employers':
            return <Employers key={b.id} b={b} {...ctx} />
          case 'faq':
            return <FaqSection key={b.id} b={b} {...ctx} />
          case 'register':
            return <Register key={b.id} b={b} {...ctx} />
          case 'gallery':
            return <GallerySection key={b.id} b={b} {...ctx} />
          default:
            return null
        }
      })}
    </>
  )
}
