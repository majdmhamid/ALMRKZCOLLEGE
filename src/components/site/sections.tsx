import React from 'react'

import type { Course, CourseGroup, Homepage, Media, News, SuccessStory } from '@/payload-types'
import { VOUCHER_TEXT, type SiteLocale } from '@/lib/rules'
import { youtubeId } from '@/lib/youtube'

import { submitLead } from './actions'
import {
  Carousel,
  CountUp,
  Faq,
  LeadForm,
  PromoStage,
  Reel,
  StaffBio,
  StaffStrip,
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
import { type Marks, col, formOnly, pic, sectionMarks, storyMarks, txt, uiText } from './edit-marks'
import { HeroVideo } from './hero-video'
import { legalHref } from './legal-links'
import { LEAD_NOTICE, leadRetentionMonths } from './notice-text'
import { PAGE_TEXT } from './page-text'
import { JsonLd, faqData } from './structured-data'
import type { getHomeData } from './data'
import { ArrowIcon, CheckIcon, ChevronDown, PlayIcon, WhatsAppIcon } from './icons'

type Home = Awaited<ReturnType<typeof getHomeData>>
type Section = NonNullable<Homepage['sections']>[number]
type Ctx = { shared: Shared; home: Home; locale: SiteLocale; n?: string }

const delay = (i: number, step: number) =>
  ({ ['--d' as string]: `${i * step}ms` }) as React.CSSProperties
const nn = (i: number) => String(i + 1).padStart(2, '0')

/** «(opens in a new window)» — read out by screen readers after a link with target="_blank". */
export const NewTab = ({ locale }: { locale: SiteLocale }) => (
  <span className="sr-only"> ({A11Y[locale].newTab})</span>
)

export function Kicker({
  n,
  label,
  center,
  edit,
}: {
  n?: string
  label?: string | null
  center?: boolean
  /** «عدّل الموقع» mark (preview mode only) */
  edit?: Marks
}) {
  if (!label) return null
  return (
    <div className={`kicker${center ? ' center' : ''}`}>
      {center && <span className="line" aria-hidden="true" />}
      {n && <span aria-hidden="true">{n}</span>}
      {!center && <span className="line" aria-hidden="true" />}
      <span className="label" {...edit}>
        {label}
      </span>
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
  const d = col('courses', c.id)
  return (
    <article data-reveal="" className="glass lift zoom course-card" style={delay(i, 90)}>
      <a
        href={courseHref(locale, c)}
        className="course-media"
        style={{ display: 'block' }}
        {...pic(d, 'coverImage', `صورة الدورة: ${c.name}`)}
      >
        {img && (
          <img
            src={img}
            alt={mediaAlt(c.coverImage)}
            className="cover"
            loading={eager ? undefined : 'lazy'}
            decoding="async"
          />
        )}
        {group && (
          <span className="tag" {...txt(col('course-groups', group.id), 'name', 'اسم المجال')}>
            {group.name}
          </span>
        )}
      </a>
      <div className="course-body">
        <h3>
          <a href={courseHref(locale, c)} {...txt(d, 'name', 'اسم الدورة')}>
            {c.name}
          </a>
        </h3>
        <p className="sum" {...txt(d, 'shortDescription', `وصف مختصر: ${c.name}`, true)}>
          {c.shortDescription}
        </p>
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
          <a
            href={courseHref(locale, c)}
            className="btn btn-green"
            {...uiText('common.viewCourse', 'زر «تفاصيل الدورة»')}
          >
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
  // «top» is the <main> itself (skip link, home tab): the hero gets its own id, never a duplicate.
  const id = b.anchor && b.anchor !== 'top' ? b.anchor : 'hero'
  const m = sectionMarks(b)
  return (
    <section
      id={id}
      className="hero"
      {...m.f('', 'الفيديو والصورة بالخلفية', [
        ['video', 'video', 'الفيديو بالخلفية'],
        ['poster', 'image', 'صورة الغلاف'],
      ])}
    >
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
              {...pic('site-settings', 'logoDark', 'اللوغو (على خلفية غامقة)')}
            />
          )}
          {b.badge && (
            <div>
              <span className="hero-badge" {...m.t('badge', 'الشارة الصغيرة')}>
                <span className="dot" />
                {b.badge}
              </span>
            </div>
          )}
          <h1 {...m.t('title', 'العنوان الكبير')}>{b.title}</h1>
          {b.kicker && (
            <p className="hero-kicker" {...m.t('kicker', 'الجملة الملوّنة')}>
              {b.kicker}
            </p>
          )}
          {b.text && (
            <p className="hero-text" {...m.t('text', 'النص التعريفي', true)}>
              {b.text}
            </p>
          )}
          <div className="hero-ctas">
            <a
              href={whatsappHref(shared)}
              target="_blank"
              rel="noopener"
              className="btn btn-wa ring"
              {...m.t('whatsappButton', 'زر الواتساب')}
            >
              <WhatsAppIcon />
              {b.whatsappButton}
              <NewTab locale={locale} />
            </a>
            <a href="#register" className="btn btn-glass" {...m.t('registerButton', 'زر التسجيل')}>
              {b.registerButton}
            </a>
          </div>
          {b.coursesLink && (
            <a href="#fields" className="hero-courses" {...m.t('coursesLink', 'رابط الدورات')}>
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
                    <span className="nm" {...txt(col('course-groups', g.id), 'name', 'اسم المجال')}>
                      {g.name}
                    </span>
                    {cl && <span className="ct">{cl}</span>}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {b.scrollHint && (
        <a
          href="#stats"
          className="hero-scroll"
          aria-label={b.scrollHint}
          {...m.t('scrollHint', 'نص «اسحب للأسفل»')}
        >
          <span>{b.scrollHint}</span>
          <ChevronDown />
        </a>
      )}
    </section>
  )
}

function Stats({ b }: { b: Extract<Section, { blockType: 'stats' }> } & Ctx) {
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'stats'} className="stats">
      <div className="glass stats-box">
        {(b.items ?? []).map((s) => (
          <a key={s.id} href={s.anchor ? `#${s.anchor}` : '#'}>
            <span
              dir="ltr"
              className="stat-num"
              {...m.f(`items.#${s.id}`, `الرقم: ${s.label}`, [
                ['value', 'number', 'الرقم'],
                ['suffix', 'plain', 'بعد الرقم (مثلاً +)'],
                ['label', 'text', 'الوصف'],
              ])}
            >
              <CountUp value={s.value} />
              <span>{s.suffix}</span>
            </span>
            <span className="stat-label" {...m.t(`items.#${s.id}.label`, 'وصف الرقم')}>
              {s.label}
            </span>
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
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'fields'} className="sec" style={{ padding: '72px 20px 24px' }}>
      <div className="wrap">
        <Carousel
          prevLabel={A11Y[locale].prev}
          nextLabel={A11Y[locale].next}
          hint={b.swipeHint}
          header={
            <div>
              <Kicker n={n} label={b.kicker} edit={m.t('kicker', 'العنوان الصغير')} />
              <h2 className="h2" {...m.t('title', 'العنوان')}>
                {b.title}
              </h2>
              {b.subtitle && (
                <p className="lead" {...m.t('subtitle', 'النص تحت العنوان', true)}>
                  {b.subtitle}
                </p>
              )}
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
                <div
                  className="field-media"
                  {...pic(col('course-groups', g.id), 'image', `صورة المجال: ${g.name}`)}
                >
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
                    <h3 {...txt(col('course-groups', g.id), 'name', 'اسم المجال')}>{g.name}</h3>
                    {g.tagline && (
                      <p {...txt(col('course-groups', g.id), 'tagline', `سطر المجال: ${g.name}`)}>
                        {g.tagline}
                      </p>
                    )}
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
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'courses'} className="sec">
      <div className="wrap">
        <div data-reveal="" className="section-head" style={{ marginBottom: 24 }}>
          <div>
            <Kicker n={n} label={b.kicker} edit={m.t('kicker', 'العنوان الصغير')} />
            <h2 className="h2" {...m.t('title', 'العنوان')}>
              {b.title}
            </h2>
          </div>
          {b.allCoursesButton && (
            <a
              href={`/${locale}/courses`}
              className="btn btn-outline"
              {...m.t('allCoursesButton', 'زر «كل الدورات»')}
            >
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

/** Published courses with a start date that hasn't passed yet, soonest first. */
export function upcomingCourses(shared: Shared, now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return shared.courses
    .filter((c) => c.nextStart && new Date(c.nextStart) >= today)
    .sort((a, b) => a.nextStart!.localeCompare(b.nextStart!))
}

/**
 * «دورات تفتح قريباً»: shown by itself (homepage, after the featured courses, and the /courses
 * page) as soon as at least one course has a «موعد البدء» date in the admin panel.
 */
export function UpcomingCourses({
  shared,
  locale,
  limit = 6,
}: {
  shared: Shared
  locale: SiteLocale
  limit?: number
}) {
  const list = upcomingCourses(shared).slice(0, limit)
  if (!list.length) return null
  const t = PAGE_TEXT[locale]
  return (
    <section id="upcoming" className="sec" style={{ padding: '24px 20px 40px' }}>
      <div className="wrap">
        <div data-reveal="" className="section-head" style={{ marginBottom: 18 }}>
          <div>
            <Kicker label={t.upcomingKicker} />
            <h2 className="h2">{t.upcomingTitle}</h2>
          </div>
        </div>
        <ul className="upcoming">
          {list.map((c, i) => (
            <li key={c.id} data-reveal="" className="glass lift" style={delay(i, 70)}>
              <time dateTime={c.nextStart!} className="upcoming-date">
                {formatDate(c.nextStart!, locale)}
              </time>
              <a
                href={courseHref(locale, c)}
                className="upcoming-name"
                {...txt(col('courses', c.id), 'name', 'اسم الدورة')}
              >
                {c.name}
              </a>
              {asDoc(c.group)?.name && (
                <span className="upcoming-group">{asDoc(c.group)?.name}</span>
              )}
              <ArrowIcon size={18} color="#158942" className="arrow upcoming-arrow" />
            </li>
          ))}
        </ul>
        <p className="upcoming-note">{t.upcomingNote}</p>
      </div>
    </section>
  )
}

function Why({ b, n }: { b: Extract<Section, { blockType: 'why' }> } & Ctx) {
  const img = mediaUrl(b.image, 'wide')
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'why'} className="sec">
      <div className="why-grid">
        <div>
          <div data-reveal="">
            <Kicker n={n} label={b.kicker} edit={m.t('kicker', 'العنوان الصغير')} />
          </div>
          <h2 data-reveal="" className="h2" {...m.t('title', 'العنوان')}>
            {b.title}
          </h2>
          <ol className="steps">
            {(b.items ?? []).map((w, i) => (
              <li key={w.id} data-reveal="x" style={delay(i, 110)}>
                <span className="num">{nn(i)}</span>
                <div className="glass">
                  <h3 {...m.t(`items.#${w.id}.title`, 'عنوان النقطة')}>{w.title}</h3>
                  {w.text && <p {...m.t(`items.#${w.id}.text`, 'نص النقطة', true)}>{w.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal="" style={{ position: 'relative' }}>
          <div className="zoom why-photo" {...m.f('', 'الصورة', [['image', 'image', 'الصورة']])}>
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
                <span key={p.id} {...m.t(`pills.#${p.id}.text`, 'شارة فوق الصورة')}>
                  {p.text}
                </span>
              ))}
            </div>
          </div>
          {b.badgeNumber && (
            <div className="glass why-badge">
              <p
                dir="ltr"
                className="n"
                {...m.f('', 'الرقم بالبطاقة العائمة', [['badgeNumber', 'plain', 'الرقم']])}
              >
                {b.badgeNumber}
              </p>
              {b.badgeText && (
                <p className="t" {...m.t('badgeText', 'النص تحت الرقم')}>
                  {b.badgeText}
                </p>
              )}
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
    edit: storyMarks(s),
  }))
  const m = sectionMarks(b)
  return (
    <section
      id={b.anchor || 'graduates'}
      className="sec"
      style={{ padding: '56px 0', overflow: 'hidden' }}
    >
      <div className="wrap" style={{ padding: '0 20px' }}>
        <div data-reveal="" className="section-head center">
          <Kicker n={n} label={b.kicker} center edit={m.t('kicker', 'العنوان الصغير')} />
          <h2 className="h2" {...m.t('title', 'العنوان')}>
            {b.title}
          </h2>
          {b.subtitle && (
            <p className="lead" {...m.t('subtitle', 'النص تحت العنوان', true)}>
              {b.subtitle}
            </p>
          )}
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
  locale,
  n,
}: { b: Extract<Section, { blockType: 'staff' }> } & Ctx) {
  const chosen = (b.members ?? []).map((s) => asDoc(s)).filter(Boolean) as typeof home.staff
  const staff = chosen.length ? chosen : home.staff
  if (!staff.length) return null
  // the moving strip needs at least 6 cards per copy to fill wide screens
  const unit = Array.from({ length: Math.ceil(6 / staff.length) }, () => staff).flat()
  const loop = [...unit, ...unit, ...unit]
  // the middle copy's first round is the real one; the rest are hidden from screen readers
  const real = (i: number) => i >= unit.length && i < unit.length + staff.length
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'staff'} className="staff-sec">
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div data-reveal="" className="section-head center" style={{ marginBottom: 30 }}>
          <Kicker n={n} label={b.kicker} center edit={m.t('kicker', 'العنوان الصغير')} />
          <h2 className="h2" {...m.t('title', 'العنوان')}>
            {b.title}
          </h2>
          {b.subtitle && (
            <p className="lead" {...m.t('subtitle', 'النص تحت العنوان', true)}>
              {b.subtitle}
            </p>
          )}
        </div>
      </div>
      <StaffStrip
        labels={{
          prev: A11Y[locale].prev,
          next: A11Y[locale].next,
          pause: A11Y[locale].pauseStrip,
          resume: A11Y[locale].resumeStrip,
          hint: A11Y[locale].staffHint,
        }}
      >
          {loop.map((s, i) => (
            <article
              key={i}
              dir="rtl"
              className="staff-card"
              aria-hidden={!real(i) || undefined}
            >
              <div className="staff-photo" {...pic(col('staff', s.id), 'photo', `صورة: ${s.name}`)}>
                {mediaUrl(s.photo, 'card') && (
                  <img src={mediaUrl(s.photo, 'card')} alt="" decoding="async" />
                )}
              </div>
              <div className="staff-info">
                <h3 {...txt(col('staff', s.id), 'name', 'الاسم — الطاقم')}>{s.name}</h3>
                <p className="staff-role" {...txt(col('staff', s.id), 'role', `الوظيفة: ${s.name}`)}>
                  {s.role}
                </p>
                {s.bio && (
                  <StaffBio
                    edit={txt(col('staff', s.id), 'bio', `نبذة: ${s.name}`, true)}
                    bio={s.bio}
                    more={shared.ui.common?.readMore ?? ''}
                    less={shared.ui.nav?.close ?? ''}
                    tabIndex={real(i) ? undefined : -1}
                  />
                )}
              </div>
            </article>
          ))}
      </StaffStrip>
    </section>
  )
}

export { youtubeId }

function Videos({ b, shared, locale, n }: { b: Extract<Section, { blockType: 'videos' }> } & Ctx) {
  const promo = b.promo
  const poster = mediaUrl(promo?.poster, 'wide')
  const m = sectionMarks(b)
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
          <Kicker n={n} label={b.kicker} center edit={m.t('kicker', 'العنوان الصغير')} />
          <h2 className="h2" {...m.t('title', 'العنوان')}>
            {b.title}
          </h2>
          {b.subtitle && (
            <p className="lead" {...m.t('subtitle', 'النص تحت العنوان', true)}>
              {b.subtitle}
            </p>
          )}
        </div>
        {(promo?.video || promo?.youtubeUrl || poster) && (
          <div
            data-reveal=""
            className="stage-frame"
            {...m.f('promo', 'الفيديو التعريفي الكبير', [
              ['video', 'video', 'ملف الفيديو'],
              ['poster', 'image', 'صورة الغلاف'],
              ['title', 'text', 'عنوان الفيديو'],
              ['subtitle', 'text', 'سطر تحت العنوان'],
              ['kind', 'text', 'النوع (مثلاً «إعلان تعريفي»)'],
              ['durationLabel', 'plain', 'مدة الفيديو (مثلاً 1:00)'],
              ['youtubeUrl', 'plain', 'أو رابط يوتيوب (بدل الملف)'],
            ])}
          >
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
                  {promo?.kind && <small {...m.t('promo.kind', 'نوع الفيديو')}>{promo.kind}</small>}
                  {promo?.title && (
                    <p className="t" {...m.t('promo.title', 'عنوان الفيديو')}>
                      {promo.title}
                    </p>
                  )}
                  {promo?.subtitle && (
                    <p className="s" {...m.t('promo.subtitle', 'سطر تحت عنوان الفيديو')}>
                      {promo.subtitle}
                    </p>
                  )}
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
                <div
                  key={r.id}
                  data-reveal=""
                  className="reel"
                  style={delay(i, 80)}
                  {...m.f(`reels.#${r.id}`, `فيديو — ريل: ${r.title}`, [
                    ['video', 'video', 'الفيديو (طولي)'],
                    ['poster', 'image', 'صورة الغلاف (طولية)'],
                    ['title', 'text', 'العنوان'],
                    ['course', 'course', 'الدورة (زر «تفاصيل الدورة»)'],
                    ['durationLabel', 'plain', 'المدة (مثلاً 0:20)'],
                  ])}
                >
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
                    <p className="t" {...m.t(`reels.#${r.id}.title`, 'عنوان الريل')}>
                      {r.title}
                    </p>
                  </Reel>
                  <a
                    href={whatsappHref(shared, `${b.whatsappMessage ?? ''}${course?.name ?? ''}`)}
                    target="_blank"
                    rel="noopener"
                    className="reel-link"
                    {...uiText('common.viewCourse', 'زر «تفاصيل الدورة»')}
                  >
                    {shared.ui.common?.viewCourse}
                    <NewTab locale={locale} />
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

/** One news item as a card (homepage «أخبار» section and the /news page). */
export function NewsCard({
  x,
  shared,
  locale,
  i = 0,
}: {
  x: News
  shared: Shared
  locale: SiteLocale
  i?: number
}) {
  const img = mediaUrl(x.coverImage, 'card')
  const d = col('news', x.id)
  return (
    <a
      href={`/${locale}/news/${x.slug}`}
      data-reveal=""
      className="glass lift zoom news-card"
      style={delay(i, 100)}
    >
      <div className="course-media" {...pic(d, 'coverImage', `صورة الخبر: ${x.title}`)}>
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
        <h3 {...txt(d, 'title', 'عنوان الخبر')}>{x.title}</h3>
        {x.excerpt && (
          <p className="ex" {...txt(d, 'excerpt', `ملخّص الخبر: ${x.title}`, true)}>
            {x.excerpt}
          </p>
        )}
        <span className="more" {...uiText('common.readMore', '«اقرأ المزيد»')}>
          {shared.ui.common?.readMore}
          <ArrowIcon />
        </span>
      </div>
    </a>
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
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'news'} className="sec" style={{ padding: '36px 20px 56px' }}>
      <div className="wrap">
        <div data-reveal="" className="section-head" style={{ marginBottom: 24 }}>
          <div>
            <Kicker n={n} label={b.kicker} edit={m.t('kicker', 'العنوان الصغير')} />
            <h2 className="h2" {...m.t('title', 'العنوان')}>
              {b.title}
            </h2>
          </div>
          <a href={`/${locale}/news`} className="btn btn-outline">
            {PAGE_TEXT[locale].allNews}
            <ArrowIcon />
          </a>
        </div>
        <div className="news-grid">
          {items.map((x, i) => (
            <NewsCard key={x.id} x={x} shared={shared} locale={locale} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Partners({
  b,
  home,
  locale,
}: { b: Extract<Section, { blockType: 'partners' }> } & Ctx) {
  const chosen = (b.partners ?? []).map((p) => asDoc(p)).filter(Boolean) as typeof home.partners
  const partners = chosen.length ? chosen : home.partners
  if (!partners.length) return null
  return (
    <section id={b.anchor || 'partners'} className="partners-sec">
      <p data-reveal="" className="partners-title" {...sectionMarks(b).t('title', 'العنوان')}>
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
              <div
                key={i}
                className="partner"
                aria-hidden={i >= partners.length || undefined}
                {...pic(col('partners', p.id), 'logo', `لوغو: ${p.name}`)}
              >
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener"
                    tabIndex={i >= partners.length ? -1 : undefined}
                    style={{ height: '100%', display: 'flex' }}
                  >
                    {img}
                    <NewTab locale={locale} />
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

function Employers({
  b,
  shared,
  locale,
  n,
}: { b: Extract<Section, { blockType: 'employers' }> } & Ctx) {
  const m = sectionMarks(b)
  return (
    <section id={b.anchor || 'employers'} className="sec" style={{ padding: '0 20px 56px' }}>
      <div data-reveal="" className="emp">
        <div className="dots" aria-hidden="true" />
        <div className="glow" aria-hidden="true" />
        <div className="emp-inner">
          <div>
            <Kicker n={n} label={b.kicker} edit={m.t('kicker', 'العنوان الصغير')} />
            <h2 className="h2" {...m.t('title', 'العنوان')}>
              {b.title}
            </h2>
            {b.text && (
              <p className="emp-text" {...m.t('text', 'النص', true)}>
                {b.text}
              </p>
            )}
            <div className="emp-btns">
              {b.whatsappButton && (
                <a
                  href={whatsappHref(shared)}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-white"
                  {...m.t('whatsappButton', 'زر الواتساب')}
                >
                  <WhatsAppIcon size={20} color="#25d366" />
                  {b.whatsappButton}
                  <NewTab locale={locale} />
                </a>
              )}
              {b.hiringButton && (
                <a
                  href="#register"
                  className="btn btn-line"
                  title={b.hiringText ?? undefined}
                  {...m.t('hiringButton', 'الزر الثاني')}
                >
                  {b.hiringButton}
                </a>
              )}
            </div>
          </div>
          <div className="emp-items">
            {(b.items ?? []).map((e, i) => (
              <div key={e.id} data-reveal="" className="emp-item" style={delay(i, 90)}>
                <small>{nn(i)}</small>
                <h3 {...m.t(`items.#${e.id}.title`, 'عنوان الخدمة')}>{e.title}</h3>
                {e.text && <p {...m.t(`items.#${e.id}.text`, 'نص الخدمة', true)}>{e.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection({ b, n }: { b: Extract<Section, { blockType: 'faq' }> } & Ctx) {
  const items = (b.items ?? []).map((f) => ({ question: f.question, answer: f.answer }))
  const m = sectionMarks(b)
  const marks = (b.items ?? []).map((f) => ({
    q: m.t(`items.#${f.id}.question`, 'السؤال'),
    a: m.t(`items.#${f.id}.answer`, 'الجواب', true),
  }))
  return (
    <section id={b.anchor || 'faq'} className="sec" style={{ padding: '0 20px 56px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div data-reveal="" style={{ textAlign: 'center', marginBottom: 22 }}>
          <Kicker n={n} label={b.kicker} center edit={m.t('kicker', 'العنوان الصغير')} />
          <h2 className="h2" {...m.t('title', 'العنوان')}>
            {b.title}
          </h2>
          {b.text && (
            <p style={{ marginTop: 8, fontSize: 16, color: '#4b5c61' }} {...m.t('text', 'النص', true)}>
              {b.text}
            </p>
          )}
        </div>
        <Faq items={items} marks={marks[0]?.q ? marks : undefined} />
      </div>
      {items.length > 0 && <JsonLd data={faqData(items)} />}
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
    notice: LEAD_NOTICE[locale].text.replace(
      '{months}',
      String(leadRetentionMonths(shared.settings.privacy?.leadsRetentionMonths)),
    ),
    privacyLink: { href: `${legalHref(locale, 'privacy')}#leads`, label: LEAD_NOTICE[locale].link },
    marketing: LEAD_NOTICE[locale].marketing,
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
    required: locale === 'he' ? 'נא למלא את השדה הזה.' : 'عبّي هذا الحقل لو سمحت.',
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
  const m = sectionMarks(b)
  const voucher = b.showVoucherNote !== false ? 1 : 0
  const bulletMark = (i: number) => {
    const row = b.bullets?.[i - voucher]
    return i >= voucher && row ? m.t(`bullets.#${row.id}.text`, 'نقطة') : undefined
  }
  return (
    <section id={b.anchor || 'register'} className="sec" style={{ padding: '0 20px 72px' }}>
      <div className="glass reg">
        <div className="glow" aria-hidden="true" />
        <div data-reveal="" style={{ position: 'relative' }}>
          <Kicker n={n} label={b.kicker} edit={m.t('kicker', 'العنوان الصغير')} />
          <h2 {...m.t('title', 'العنوان')}>{b.title}</h2>
          {b.text && (
            <p
              style={{ marginTop: 12, fontSize: 16, lineHeight: 1.7, color: '#4b5c61' }}
              {...m.t('text', 'النص', true)}
            >
              {b.text}
            </p>
          )}
          <ul className="checks">
            {lines.map((t, i) => (
              <li key={i} {...bulletMark(i)}>
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
              {...m.t('whatsappButton', 'زر الواتساب')}
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
  const sm = sectionMarks(b)
  return (
    <section id={b.anchor || 'gallery'} className="sec">
      <div className="wrap">
        <div data-reveal="" className="section-head center">
          <Kicker n={n} label={b.kicker} center edit={sm.t('kicker', 'العنوان الصغير')} />
          <h2 className="h2" {...sm.t('title', 'العنوان')}>
            {b.title}
          </h2>
          {b.subtitle && (
            <p className="lead" {...sm.t('subtitle', 'النص تحت العنوان', true)}>
              {b.subtitle}
            </p>
          )}
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
                {...formOnly('gallery', 'صور الورشات — من صفحة «معرض الصور والفيديو»')}
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
            return (
              <React.Fragment key={b.id}>
                <Featured b={b} {...ctx} />
                <UpcomingCourses shared={shared} locale={locale} />
              </React.Fragment>
            )
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
