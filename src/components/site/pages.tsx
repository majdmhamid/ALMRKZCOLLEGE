import { RichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

import type { Course, CourseGroup, News } from '@/payload-types'
import { EMPLOYMENT_NOTICE, VOUCHER_TEXT, type SiteLocale } from '@/lib/rules'

import {
  type Shared,
  asDoc,
  formatDate,
  groupHref,
  mediaAlt,
  mediaDims,
  mediaUrl,
  whatsappHref,
} from './data'
import { A11Y } from './a11y-text'
import { PrintButton, PromoStage } from './client'
import { type Marks, col, formOnly, pic, txt, uiText } from './edit-marks'
import { CheckIcon, PlayIcon, WhatsAppIcon } from './icons'
import { PAGE_TEXT } from './page-text'
import { CourseCard, NewTab, RegisterForm, UpcomingCourses, youtubeId } from './sections'
import { JsonLd, breadcrumbData, courseData } from './structured-data'

export function PageHero({
  image,
  crumbs,
  title,
  sub,
  locale,
  edit,
}: {
  image?: string
  crumbs: { href: string; label?: string | null }[]
  title: string
  sub?: string | null
  /** Language of the page (names the breadcrumb navigation for screen readers). */
  locale: SiteLocale
  /** «عدّل الموقع» marks (preview mode only) */
  edit?: { image?: Marks; title?: Marks; sub?: Marks }
}) {
  return (
    <section className="page-hero" {...edit?.image}>
      <div className="bg" aria-hidden="true">
        {image && (
          <img src={image} alt="" className="cover" fetchPriority="high" decoding="async" />
        )}
      </div>
      <div className="in">
        <nav className="crumbs" aria-label={A11Y[locale].crumbs}>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span aria-hidden="true">/</span>}
              <a href={c.href}>{c.label}</a>
            </React.Fragment>
          ))}
        </nav>
        <h1 {...edit?.title}>{title}</h1>
        {sub && (
          <p className="sub" {...edit?.sub}>
            {sub}
          </p>
        )}
      </div>
      <JsonLd data={breadcrumbData([...crumbs, { label: title }])} />
    </section>
  )
}

const Check = () => (
  <span className="check">
    <CheckIcon />
  </span>
)

const SCHEDULE: Record<SiteLocale, Record<string, string>> = {
  ar: { morning: 'صباحي', evening: 'مسائي', weekend: 'نهاية الأسبوع', online: 'عن بُعد' },
  he: { morning: 'בוקר', evening: 'ערב', weekend: 'סוף שבוע', online: 'מרחוק' },
}

const L = {
  ar: {
    about: 'عن الدورة',
    topics: 'ماذا ستتعلّم',
    facts: 'تفاصيل الدورة',
    duration: 'المدة',
    schedule: 'الدوام',
    start: 'موعد البدء',
    certificate: 'الشهادة',
    body: 'الجهة المعتمِدة',
    admission: 'شروط القبول',
    age: 'العمر',
    education: 'التعليم',
    hebrew: 'اللغة العبرية',
    experience: 'خبرة سابقة',
    after: 'بعد التخرّج',
    gallery: 'صور من الدورة',
  },
  he: {
    about: 'על הקורס',
    topics: 'מה לומדים',
    facts: 'פרטי הקורס',
    duration: 'משך',
    schedule: 'מועדי לימוד',
    start: 'מועד פתיחה',
    certificate: 'תעודה',
    body: 'גוף מאשר',
    admission: 'תנאי קבלה',
    age: 'גיל',
    education: 'השכלה',
    hebrew: 'עברית',
    experience: 'ניסיון קודם',
    after: 'אחרי הסיום',
    gallery: 'תמונות מהקורס',
  },
}

export function CoursePage({
  c,
  shared,
  locale,
}: {
  c: Course
  shared: Shared
  locale: SiteLocale
}) {
  const t = L[locale]
  const ui = shared.ui
  const group = asDoc(c.group)
  const a = c.admission
  const admission = [
    [t.age, a?.age],
    [t.education, a?.education],
    [t.hebrew, a?.hebrew],
    [t.experience, a?.experience],
  ].filter(([, v]) => v) as [string, string][]
  const facts = [
    [ui.common?.hours ?? '', c.hours ? String(c.hours) : ''],
    [ui.common?.sessions ?? '', c.sessions ? String(c.sessions) : ''],
    [t.duration, c.duration ?? ''],
    [
      t.schedule,
      [(c.schedule ?? []).map((s) => SCHEDULE[locale][s]).join(' / '), c.scheduleDetails]
        .filter(Boolean)
        .join(' · '),
    ],
    [
      t.start,
      c.nextStart
        ? formatDate(c.nextStart, locale)
        : (c.nextStartNote ?? ui.common?.nextStart ?? ''),
    ],
  ].filter(([, v]) => v)
  const gallery = (c.gallery ?? []).map((m) => asDoc(m)).filter(Boolean)
  const video = mediaUrl(c.video)
  // YouTube: only a picture + play button until the visitor clicks (youtube-nocookie after that).
  const yt = youtubeId(c.youtubeUrl)
  const ytThumb =
    mediaUrl(c.videoPoster, 'wide') ?? (yt && `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`)
  const d = col('courses', c.id)
  return (
    <>
      <PageHero
        locale={locale}
        edit={{
          image: pic(d, 'coverImage', 'صورة الدورة (الغلاف)'),
          title: txt(d, 'name', 'اسم الدورة'),
          sub: txt(d, 'shortDescription', 'وصف مختصر', true),
        }}
        image={mediaUrl(c.coverImage, 'hero')}
        crumbs={[
          { href: `/${locale}`, label: ui.nav?.home },
          { href: `/${locale}/courses`, label: ui.nav?.courses },
          ...(group ? [{ href: groupHref(locale, group), label: group.name }] : []),
        ]}
        title={c.name}
        sub={c.shortDescription}
      />
      <JsonLd data={courseData(c, locale)} />
      <div className="detail course-detail">
        <div>
          {(Boolean(c.fullDescription) || Boolean(c.highlights?.length)) && (
            <section className="card glass">
              <h2>{t.about}</h2>
              {c.fullDescription && (
                <div className="prose" {...formOnly(d, 'الوصف الكامل — بينعدّل من صفحة الدورة الكاملة')}>
                  <RichText data={c.fullDescription} />
                </div>
              )}
              {!!c.highlights?.length && (
                <ul className="bullets" style={{ marginTop: 14 }}>
                  {c.highlights.map((h) => (
                    <li key={h.id} {...txt(d, `highlights.#${h.id}.text`, 'نقطة بارزة')}>
                      <Check />
                      {h.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {!!c.topics?.length && (
            <section className="card glass">
              <h2>{t.topics}</h2>
              <ul className="bullets">
                {c.topics.map((x) => (
                  <li key={x.id} {...txt(d, `topics.#${x.id}.topic`, 'موضوع بالدورة')}>
                    <Check />
                    {x.topic}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card glass">
            <h2>{t.certificate}</h2>
            <ul className="facts-list">
              <li>
                <span>{t.certificate}</span>
                <b {...txt(d, 'certificate', 'الشهادة')}>{c.certificate}</b>
              </li>
              <li>
                <span>{t.body}</span>
                <b {...txt(d, 'certifyingBody', 'الجهة المعتمِدة')}>{c.certifyingBody}</b>
              </li>
            </ul>
            {c.certificateValue && (
              <p className="prose" style={{ marginTop: 12 }} {...txt(d, 'certificateValue', 'قيمة الشهادة', true)}>
                {c.certificateValue}
              </p>
            )}
          </section>
          {(admission.length > 0 || !!a?.other?.length) && (
            <section className="card glass">
              <h2>{t.admission}</h2>
              <ul className="facts-list">
                {admission.map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </li>
                ))}
                {(a?.other ?? []).map((o) => (
                  <li key={o.id} {...txt(d, `admission.other.#${o.id}.text`, 'شرط قبول')}>
                    <span>{o.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {/* Always shown (college rule): the fixed employment notice, even when the
              course has no «بعد التخرّج» text of its own. */}
          <section className="card glass">
            <h2>{t.after}</h2>
            {c.careerGuidance && (
              <p className="prose" {...txt(d, 'careerGuidance', 'بعد التخرّج (مرافقة وتوجيه)', true)}>
                {c.careerGuidance}
              </p>
            )}
            <p className="note muted" style={c.careerGuidance ? { marginTop: 12 } : undefined}>
              {EMPLOYMENT_NOTICE[locale]}
            </p>
          </section>
          {(gallery.length > 0 || video || yt) && (
            <section className="card glass">
              <h2>{t.gallery}</h2>
              {yt && (
                <div className="lift stage" style={{ marginBottom: 12 }}>
                  <PromoStage
                    youtubeId={yt}
                    playLabel={`${A11Y[locale].play}: ${c.name}`}
                    title={c.name}
                  >
                    {ytThumb && (
                      <img src={ytThumb} alt="" className="cover" loading="lazy" decoding="async" />
                    )}
                    <div className="stage-shade" />
                    <span className="play ring" style={{ width: 60, height: 60 }}>
                      <PlayIcon size={26} />
                    </span>
                  </PromoStage>
                </div>
              )}
              {video && (
                <video
                  src={video}
                  poster={mediaUrl(c.videoPoster, 'wide')}
                  controls
                  playsInline
                  title={c.name}
                  style={{ width: '100%', borderRadius: 16, marginBottom: 12 }}
                />
              )}
              <div className="gallery-grid">
                {gallery.map((m) => (
                  <img
                    key={m!.id}
                    src={mediaUrl(m, 'card')}
                    alt={mediaAlt(m)}
                    loading="lazy"
                    decoding="async"
                    {...mediaDims(m)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="sticky-side">
          <section className="card glass">
            <h2>{t.facts}</h2>
            <ul className="facts-list">
              {facts.map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span>
                  <b>{v}</b>
                </li>
              ))}
            </ul>
          </section>
          {c.voucherEligible && <p className="note">{VOUCHER_TEXT[locale]}</p>}
          {ui.course?.contactForPrice && (
            <p className="note muted" {...uiText('course.contactForPrice', 'جملة «تواصل معنا للسعر»')}>
              {ui.course.contactForPrice}
            </p>
          )}
          <PrintButton label={PAGE_TEXT[locale].print} />
          <PrintContact shared={shared} locale={locale} />
          <a
            href={whatsappHref(
              shared,
              `${shared.settings.contact?.whatsappMessage ?? ''} — ${c.name}`,
            )}
            target="_blank"
            rel="noopener"
            className="btn btn-wa"
            style={{ height: 54, borderRadius: 16 }}
          >
            <WhatsAppIcon />
            {ui.common?.whatsappLong}
            <NewTab locale={locale} />
          </a>
          <section className="card glass" id="register">
            <h2>{ui.common?.registerInterest}</h2>
            <RegisterForm
              shared={shared}
              locale={locale}
              source={`/${locale}/course/${c.slug}`}
              defaultCourse={c.id}
            />
          </section>
        </aside>
      </div>
    </>
  )
}

/** Only on paper / PDF: who to call about the course (the page's header and footer are hidden). */
function PrintContact({ shared, locale }: { shared: Shared; locale: SiteLocale }) {
  const s = shared.settings
  const phones = (s.contact?.phones ?? []).map((p) => p.number)
  return (
    <p className="print-only note muted">
      <b>{s.siteName}</b> · {PAGE_TEXT[locale].printFooter}:{' '}
      <span dir="ltr">{[...phones, s.contact?.email].filter(Boolean).join(' · ')}</span>
    </p>
  )
}

export function GroupPage({
  g,
  shared,
  locale,
}: {
  g: CourseGroup
  shared: Shared
  locale: SiteLocale
}) {
  const courses = shared.courses.filter((c) => (asDoc(c.group)?.id ?? c.group) === g.id)
  const gd = col('course-groups', g.id)
  return (
    <>
      <PageHero
        locale={locale}
        edit={{
          image: pic(gd, 'image', 'صورة المجال'),
          title: txt(gd, 'name', 'اسم المجال'),
          sub: txt(gd, g.description ? 'description' : 'tagline', 'وصف المجال', true),
        }}
        image={mediaUrl(g.image, 'hero')}
        crumbs={[
          { href: `/${locale}`, label: shared.ui.nav?.home },
          { href: `/${locale}/courses`, label: shared.ui.nav?.courses },
        ]}
        title={g.name}
        sub={g.description || g.tagline}
      />
      <div className="wrap" style={{ padding: '40px 20px 56px' }}>
        {/* Heading for screen readers: the course cards below are h3. */}
        <h2 className="sr-only">{A11Y[locale].courses}</h2>
        {courses.length ? (
          <div className="course-grid">
            {courses.map((c, i) => (
              <CourseCard key={c.id} c={c} shared={shared} locale={locale} i={i} />
            ))}
          </div>
        ) : (
          <div className="card glass" style={{ textAlign: 'center' }}>
            <p className="prose">{shared.ui.course?.contactForPrice}</p>
            <a
              href={whatsappHref(
                shared,
                `${shared.settings.contact?.whatsappMessage ?? ''} — ${g.name}`,
              )}
              target="_blank"
              rel="noopener"
              className="btn btn-wa"
              style={{ height: 50, padding: '0 20px', marginTop: 14 }}
            >
              <WhatsAppIcon />
              {shared.ui.common?.whatsappLong}
              <NewTab locale={locale} />
            </a>
          </div>
        )}
      </div>
    </>
  )
}

export function AllCoursesPage({ shared, locale }: { shared: Shared; locale: SiteLocale }) {
  return (
    <>
      <PageHero
        locale={locale}
        image={mediaUrl(shared.groups[0]?.image, 'hero')}
        crumbs={[{ href: `/${locale}`, label: shared.ui.nav?.home }]}
        title={shared.ui.nav?.allCourses ?? shared.ui.nav?.courses ?? ''}
      />
      <UpcomingCourses shared={shared} locale={locale} limit={12} />
      <div className="wrap" style={{ padding: '40px 20px 56px', display: 'grid', gap: 40 }}>
        {shared.groups.map((g) => {
          const courses = shared.courses.filter((c) => (asDoc(c.group)?.id ?? c.group) === g.id)
          if (!courses.length) return null
          return (
            <section key={g.id}>
              <div className="section-head" style={{ marginBottom: 18 }}>
                <div>
                  <h2 className="h2" style={{ fontSize: 'clamp(24px,3vw,34px)' }}>
                    <a href={groupHref(locale, g)} {...txt(col('course-groups', g.id), 'name', 'اسم المجال')}>
                      {g.name}
                    </a>
                  </h2>
                  {g.tagline && (
                    <p className="lead" {...txt(col('course-groups', g.id), 'tagline', `سطر المجال: ${g.name}`)}>
                      {g.tagline}
                    </p>
                  )}
                </div>
              </div>
              <div className="course-grid">
                {courses.map((c, i) => (
                  <CourseCard key={c.id} c={c} shared={shared} locale={locale} i={i} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}

export function NewsPage({ n, shared, locale }: { n: News; shared: Shared; locale: SiteLocale }) {
  const gallery = (n.gallery ?? []).map((m) => asDoc(m)).filter(Boolean)
  const d = col('news', n.id)
  return (
    <>
      <PageHero
        locale={locale}
        edit={{ image: pic(d, 'coverImage', 'صورة الخبر'), title: txt(d, 'title', 'عنوان الخبر') }}
        image={mediaUrl(n.coverImage, 'hero')}
        crumbs={[
          { href: `/${locale}`, label: shared.ui.nav?.home },
          { href: `/${locale}/news`, label: shared.ui.nav?.news || PAGE_TEXT[locale].news },
        ]}
        title={n.title}
        sub={formatDate(n.publishedAt, locale)}
      />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 56px' }}>
        <article className="card glass">
          {n.excerpt && (
            <p className="prose" style={{ fontWeight: 700 }} {...txt(d, 'excerpt', 'ملخّص الخبر', true)}>
              {n.excerpt}
            </p>
          )}
          {n.content && (
            <div className="prose" style={{ marginTop: 14 }} {...formOnly(d, 'نص الخبر — بينعدّل من صفحة الخبر الكاملة')}>

              <RichText data={n.content} />
            </div>
          )}
          {mediaUrl(n.coverImage, 'wide') && (
            <img
              src={mediaUrl(n.coverImage, 'wide')}
              alt={mediaAlt(n.coverImage)}
              loading="lazy"
              decoding="async"
              {...mediaDims(n.coverImage)}
              style={{ width: '100%', height: 'auto', borderRadius: 16, marginTop: 18 }}
            />
          )}
          {gallery.length > 0 && (
            <div className="gallery-grid" style={{ marginTop: 14 }}>
              {gallery.map((m) => (
                <img
                  key={m!.id}
                  src={mediaUrl(m, 'card')}
                  alt={mediaAlt(m)}
                  loading="lazy"
                  decoding="async"
                  {...mediaDims(m)}
                />
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  )
}
