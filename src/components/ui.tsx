import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Course, Group, NewsPost } from "@content/types";
import { site } from "@content/site";
import { formatDate, href, t, type Locale } from "@/lib/i18n";
import { ArrowIcon, CalendarIcon, ClockIcon, LayersIcon, WhatsAppIcon } from "./Icons";

/* ---------- عناوين الأقسام ---------- */
export function SectionHeading({ eyebrow, title, text, center, className = "" }: { eyebrow?: string; title: string; text?: string; center?: boolean; className?: string }) {
  return (
    <div className={`mb-10 max-w-3xl ${center ? "mx-auto text-center" : ""} ${className}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="h2">{title}</h2>
      {text && <p className="lead mt-3">{text}</p>}
    </div>
  );
}

/* ---------- رأس الصفحات الداخلية ---------- */
export function PageHero({ title, text, image, eyebrow, children }: { title: string; text?: string; image?: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/70 to-brand-900/30" />
        </>
      )}
      <div className="container-x relative py-16 md:py-24">
        {eyebrow && <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{eyebrow}</span>}
        <h1 className="h1 max-w-4xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">{text}</p>}
        {children}
      </div>
    </section>
  );
}

/* ---------- مسار التنقل (breadcrumbs) ---------- */
export function Breadcrumbs({ items, className = "" }: { items: { label: string; to?: string }[]; className?: string }) {
  return (
    <nav aria-label="breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="text-current/50">/</span>}
            {it.to ? (
              <Link href={it.to} className="hover:underline">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-bold">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- بطاقة دورة ---------- */
export function CourseCard({ course, locale, groupName, labels }: { course: Course; locale: Locale; groupName?: string; labels: { hours: string; sessions: string; view: string } }) {
  const to = href(locale, `/courses/${course.group}/${course.slug}`);
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={to} className="relative block aspect-[16/10] overflow-hidden bg-brand-100" tabIndex={-1} aria-hidden="true">
        <Image src={course.image} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
        {groupName && <span className="absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-700">{groupName}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold leading-snug">
          <Link href={to} className="hover:text-brand-700">
            {t(course.name, locale)}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{t(course.summary, locale)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <ClockIcon width={16} height={16} /> {course.hours} {labels.hours}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarIcon width={16} height={16} /> {course.sessions} {labels.sessions}
          </span>
        </div>
        <Link href={to} className="mt-4 inline-flex items-center gap-1 font-bold text-brand-600 hover:underline">
          {labels.view}
          <ArrowIcon width={16} height={16} />
        </Link>
      </div>
    </article>
  );
}

/* ---------- بطاقة مجموعة ---------- */
export function GroupCard({ group, locale, count }: { group: Group; locale: Locale; count: string }) {
  const to = href(locale, `/courses/${group.slug}`);
  return (
    <Link href={to} className="card group relative block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3]">
        <Image src={group.image} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 p-2">
            <Image src={group.icon} alt="" width={40} height={40} />
          </div>
          <h3 className="text-2xl font-extrabold">{t(group.name, locale)}</h3>
          <p className="text-sm text-white/85">{t(group.tagline, locale)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-4 text-sm font-bold text-brand-700">
        <span className="inline-flex items-center gap-1">
          <LayersIcon width={16} height={16} /> {count}
        </span>
        <ArrowIcon width={18} height={18} />
      </div>
    </Link>
  );
}

/* ---------- بطاقة خبر ---------- */
export function NewsCard({ post, locale, readMore }: { post: NewsPost; locale: Locale; readMore: string }) {
  const to = href(locale, `/news/${post.slug}`);
  return (
    <article className="card group flex flex-col overflow-hidden">
      <Link href={to} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden="true">
        <Image src={post.images[0]} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <time dateTime={post.date} className="text-sm text-ink-muted">
          {formatDate(post.date, locale)}
        </time>
        <h3 className="mt-1 text-lg font-extrabold leading-snug">
          <Link href={to} className="hover:text-brand-700">
            {t(post.title, locale)}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{t(post.excerpt, locale)}</p>
        <Link href={to} className="mt-3 inline-flex items-center gap-1 font-bold text-brand-600 hover:underline">
          {readMore}
          <ArrowIcon width={16} height={16} />
        </Link>
      </div>
    </article>
  );
}

/* ---------- شريط دعوة للتواصل ---------- */
export function CtaBand({ locale, title, text, primary, whatsapp }: { locale: Locale; title: string; text: string; primary: string; whatsapp: string }) {
  return (
    <section className="bg-brand-600 text-white">
      <div className="container-x flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="h2">{title}</h2>
          <p className="mt-2 max-w-2xl text-white/90">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={href(locale, "/contact#form")} className="btn btn-white btn-lg">
            {primary}
          </Link>
          <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp btn-lg">
            <WhatsAppIcon />
            {whatsapp}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- بيانات Schema.org ---------- */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
