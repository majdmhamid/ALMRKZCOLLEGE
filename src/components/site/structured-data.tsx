import React from 'react'

import type { Course } from '@/payload-types'
import { internationalPhone, openingHoursSpecification } from '@/lib/schema-format'
import { absoluteUrl, encodeSlug } from '@/lib/seo'
import type { SiteLocale } from '@/lib/rules'

import { type Shared, asDoc, mediaUrl } from './data'

/*
 * Structured data (schema.org JSON-LD) — what Google reads to show the college as a rich result:
 * name, address, phone, opening hours, social profiles, the courses and the breadcrumb path.
 * Everything comes from the admin panel; empty fields are simply left out.
 * No prices here either (college rule): a Course never gets an `offers` price.
 */

type Json = Record<string, unknown>

/** Drops empty values so Google never sees `"telephone": ""` and the like. */
function clean<T>(v: T): T {
  if (Array.isArray(v)) {
    return v.map(clean).filter((x) => !isEmpty(x)) as T
  }
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v)
        .map(([k, x]) => [k, clean(x)])
        .filter(([, x]) => !isEmpty(x)),
    ) as T
  }
  return v
}

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0)

export function JsonLd({ data }: { data: Json | Json[] }) {
  // `<` is escaped so a text typed in the admin panel can never close the <script> tag.
  const json = JSON.stringify(clean(data)).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

/** Absolute address of an uploaded file (Payload gives local files as /api/media/…). */
const abs = (url?: string) => (url && url.startsWith('/') ? absoluteUrl(url) : url)

const orgId = () => absoluteUrl('/#organization')

/** The college itself — on every page (from «معلومات الكلية»). */
export function organizationData(shared: Shared, locale: SiteLocale): Json {
  const s = shared.settings
  const c = s.contact
  const phones = (c?.phones ?? []).map((p) => internationalPhone(p.number))
  return {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': orgId(),
    name: s.siteName,
    alternateName: s.shortName,
    description: s.seo?.defaultDescription || s.tagline,
    url: absoluteUrl(`/${locale}`),
    logo: abs(mediaUrl(s.logoLight) || mediaUrl(s.logoMark)),
    image: abs(mediaUrl(s.seo?.ogImage, 'wide')),
    foundingDate: s.foundedYear ? String(s.foundedYear) : undefined,
    telephone: phones[0],
    email: c?.email,
    address: c?.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: c.address,
          addressLocality: s.city,
          addressCountry: 'IL',
        }
      : undefined,
    hasMap: c?.mapUrl,
    // Only lines with clear days + times («الأحد – الخميس» + «08:00 – 16:00»); Google rejects
    // free text like «تواصل معنا» here, so such lines are left out (they still show on the site).
    openingHoursSpecification: openingHoursSpecification(c?.openingHours ?? []),
    contactPoint: phones.map((telephone) => ({
      '@type': 'ContactPoint',
      telephone,
      contactType: 'customer service',
      availableLanguage: ['ar', 'he'],
    })),
    sameAs: (s.social ?? []).map((x) => x.url),
  }
}

/** One course page. */
export function courseData(c: Course, locale: SiteLocale): Json {
  const group = asDoc(c.group)
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.name,
    description: c.shortDescription || c.name,
    url: absoluteUrl(`/${locale}/course/${encodeSlug(c.slug)}`),
    image: abs(mediaUrl(c.coverImage, 'wide')),
    inLanguage: locale,
    about: group?.name,
    educationalCredentialAwarded: c.certificate,
    provider: { '@id': orgId() },
    teaches: (c.topics ?? []).map((t) => t.topic),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: c.schedule?.includes('online') ? 'online' : 'onsite',
      startDate: c.nextStart ?? undefined,
      courseSchedule: c.scheduleDetails
        ? { '@type': 'Schedule', description: c.scheduleDetails }
        : undefined,
      location: { '@id': orgId() },
    },
  }
}

/** The breadcrumb path shown at the top of inner pages (the last item is the page itself). */
export function breadcrumbData(items: { href?: string; label?: string | null }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
      .filter((i) => i.label)
      .map((i, n) => ({
        '@type': 'ListItem',
        position: n + 1,
        name: i.label,
        item: i.href ? absoluteUrl(i.href) : undefined,
      })),
  }
}

/** Questions of the «أسئلة شائعة» section. */
export function faqData(items: { question: string; answer: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}
