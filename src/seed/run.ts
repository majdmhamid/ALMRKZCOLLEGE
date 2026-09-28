/**
 * Fills the database with everything in the website design
 * (content.js + Option A texts + assets/).          npm run seed
 *
 * Runs on every deploy (`npm run ci`), but the design content is put in ONCE:
 * after a complete seed a marker is saved in the database, and later runs only
 * create the first admin (if there are no users) and stop. So anything the
 * owner deletes (a course, a success story…) is never brought back.
 * A database seeded before the marker existed counts as seeded when its
 * homepage is already filled (the last step of a full seed). A first run that
 * stopped half-way has no marker, so the next run finishes it.
 *
 * Deliberate reseed (creates what is missing, never overwrites existing items):
 *   npx cross-env SEED_FORCE=1 npm run seed
 * Also refill the pages (homepage, fixed texts, gallery, menu, site settings):
 *   npx cross-env SEED_FORCE_PAGES=1 npm run seed        (implies SEED_FORCE)
 * (`payload run` swallows --flags, so use the variables; `npm run seed -- -- --force`
 * / `-- -- --force-pages` also work.)
 */
import type { CollectionSlug, GlobalSlug, Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../payload.config'
import { courseFacts, extraCourseGroups } from './facts'
import { assetPath, loadDesign } from './loadDesign'
import * as A from './optionA'
import type { L } from './optionA'

type Locale = 'ar' | 'he'
const FORCE_PAGES = process.argv.includes('--force-pages') || process.env.SEED_FORCE_PAGES === '1'
const FORCE = FORCE_PAGES || process.argv.includes('--force') || process.env.SEED_FORCE === '1'
/** Key in Payload's key-value store (table payload_kv) saved after a complete design seed. */
const SEEDED_KEY = 'almrkz:design-seeded'

const design = loadDesign()
const D = design.dict
const pick = (v: L, l: Locale) => v[l]

/* ───────────── helpers ───────────── */

/**
 * Copies row ids from the saved Arabic document into the Hebrew data, so the
 * Hebrew save fills the same array rows / blocks instead of replacing them.
 */
function withIds<T>(data: T, saved: unknown): T {
  if (Array.isArray(data) && Array.isArray(saved)) {
    return data.map((row, i) => withIds(row, saved[i])) as T
  }
  if (
    data &&
    typeof data === 'object' &&
    saved &&
    typeof saved === 'object' &&
    !Array.isArray(data)
  ) {
    const out: Record<string, unknown> = { ...(data as Record<string, unknown>) }
    const s = saved as Record<string, unknown>
    if (typeof s.id === 'string' && !('id' in out)) out.id = s.id
    for (const [k, v] of Object.entries(out)) {
      if (v && typeof v === 'object') out[k] = withIds(v, s[k])
    }
    return out as T
  }
  return data
}

const mediaCache = new Map<string, number>()

/** Uploads a design asset once (remembered by its design path) and returns its id. */
async function media(payload: Payload, rel: string, alt: L): Promise<number> {
  const cached = mediaCache.get(rel)
  if (cached) return cached
  const { docs } = await payload.find({
    collection: 'media',
    where: { sourceFile: { equals: rel } },
    limit: 1,
    depth: 0,
  })
  let id = docs[0]?.id
  if (!id) {
    const doc = await payload.create({
      collection: 'media',
      locale: 'ar',
      data: { alt: alt.ar, sourceFile: rel },
      filePath: assetPath(rel),
    })
    await payload.update({ collection: 'media', id: doc.id, locale: 'he', data: { alt: alt.he } })
    id = doc.id
    payload.logger.info(`media: uploaded ${rel}`)
  }
  mediaCache.set(rel, id)
  return id
}

async function findIdBySlug(payload: Payload, collection: CollectionSlug, slug: string) {
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  return docs[0]?.id as number | undefined
}

/** Creates a document in Arabic, then adds the Hebrew texts. Skips existing slugs. */
async function upsert(
  payload: Payload,
  collection: CollectionSlug,
  slug: string,
  build: (l: Locale) => Record<string, unknown>,
  opts: { draft?: boolean } = {},
): Promise<number> {
  const existing = await findIdBySlug(payload, collection, slug)
  if (existing) return existing
  const status = opts.draft ? 'draft' : 'published'
  const hasDrafts = Boolean(payload.collections[collection].config.versions?.drafts)
  const extra = hasDrafts ? { _status: status } : {}
  const doc = await payload.create({
    collection,
    locale: 'ar',
    draft: opts.draft,
    depth: 0,
    data: { ...build('ar'), slug, ...extra } as never,
  })
  await payload.update({
    collection,
    id: doc.id,
    locale: 'he',
    draft: opts.draft,
    depth: 0,
    data: withIds({ ...build('he'), slug, ...extra }, doc) as never,
  })
  payload.logger.info(`${collection}: created ${slug}${opts.draft ? ' (draft)' : ''}`)
  return doc.id as number
}

/** Fills a settings page in Arabic then Hebrew (only if empty, unless --force-pages). */
async function fillGlobal(
  payload: Payload,
  slug: GlobalSlug,
  isFilled: (doc: Record<string, unknown>) => boolean,
  build: (l: Locale) => Record<string, unknown>,
) {
  const current = (await payload.findGlobal({
    slug,
    locale: 'ar',
    depth: 0,
    draft: true,
  })) as unknown as Record<string, unknown>
  if (!FORCE_PAGES && isFilled(current))
    return payload.logger.info(`${slug}: already filled — skipped`)
  const hasDrafts = Boolean(payload.globals.config.find((g) => g.slug === slug)?.versions)
  const extra = hasDrafts ? { _status: 'published' } : {}
  const ar = await payload.updateGlobal({
    slug,
    locale: 'ar',
    depth: 0,
    data: { ...build('ar'), ...extra } as never,
  })
  await payload.updateGlobal({
    slug,
    locale: 'he',
    depth: 0,
    data: withIds({ ...build('he'), ...extra }, ar) as never,
  })
  payload.logger.info(`${slug}: filled from the design`)
}

/* ───────────── content ───────────── */

async function seedAdmin(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs > 0) return
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    return payload.logger.warn(
      'users: none yet. Set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD, or create the first admin at /admin.',
    )
  }
  await payload.create({
    collection: 'users',
    data: { email, password, name: 'مدير', roles: ['admin'] },
  })
  payload.logger.info(`users: created admin ${email}`)
}

const galleryAlt = (i: number): L => ({
  ar: `صورة من التدريب العملي في ورشات كلية المركز (${i + 1})`,
  he: `תמונה מהתרגול המעשי בסדנאות מכללת המרכז (${i + 1})`,
})

/** Why the design content is already in the database, or null when it still has to be seeded. */
async function alreadySeeded(payload: Payload): Promise<string | null> {
  const marker = await payload.kv.get<{ at?: string }>(SEEDED_KEY)
  if (marker) return `design content was seeded on ${marker.at ?? 'an earlier deploy'}`
  // Databases seeded before the marker existed: the homepage is the last step of a full seed.
  const home = await payload.findGlobal({ slug: 'homepage', locale: 'ar', depth: 0, draft: true })
  if (!home.sections?.length) return null
  await payload.kv.set(SEEDED_KEY, { at: new Date().toISOString(), legacy: true })
  return 'the homepage is already filled (seeded before the marker; marker saved now)'
}

async function run(payload: Payload) {
  await seedAdmin(payload)
  if (FORCE) {
    payload.logger.info(
      `seed: forced (${FORCE_PAGES ? 'SEED_FORCE_PAGES' : 'SEED_FORCE'}) — creating what is missing from the design`,
    )
  } else {
    const reason = await alreadySeeded(payload)
    if (reason) {
      payload.logger.info(
        `seed: skipped all design content (courses, groups, stories, staff, partners, news, media, ` +
          `pages) — ${reason}. Deleted items stay deleted. To reseed on purpose: npx cross-env SEED_FORCE=1 npm run seed`,
      )
      return
    }
  }
  await seedDesign(payload)
  await payload.kv.set(SEEDED_KEY, { at: new Date().toISOString() })
  payload.logger.info(`seed: saved marker «${SEEDED_KEY}» — later deploys won't seed again`)
}

async function seedDesign(payload: Payload) {
  const site = design.site

  /* media used in several places */
  const logo = await media(payload, 'assets/brand/logo.png', {
    ar: 'شعار كلية المركز للتأهيل المهني',
    he: 'הלוגו של מכללת המרכז להכשרה מקצועית',
  })
  const logoWhite = await media(payload, 'assets/brand/logo-white.png', {
    ar: 'شعار كلية المركز (أبيض)',
    he: 'הלוגו של מכללת המרכז (לבן)',
  })
  const poster = await media(payload, 'assets/hero/poster.webp', {
    ar: 'طلاب يتدرّبون في ورشة كلية المركز',
    he: 'תלמידים מתאמנים בסדנה של מכללת המרכז',
  })
  const heroVideo = await media(payload, 'assets/hero.mp4', {
    ar: 'فيديو قصير من ورشات كلية المركز',
    he: 'סרטון קצר מהסדנאות של מכללת המרכז',
  })
  const aboutImage = await media(payload, 'assets/hero/about.webp', {
    ar: 'التدريب العملي في ورشة كلية المركز',
    he: 'תרגול מעשי בסדנה של מכללת המרכז',
  })
  // Not used on the homepage yet — uploaded for the «عن الكلية» / «للشركات» pages.
  await media(payload, 'assets/hero/home.webp', {
    ar: 'ورشة كلية المركز',
    he: 'הסדנה של מכללת המרכז',
  })
  await media(payload, 'assets/hero/employers.webp', {
    ar: 'تأهيل عمال لشركات ومقاولين',
    he: 'הכשרת עובדים לחברות ולקבלנים',
  })

  /* course groups — a group with no (published) course in the design, e.g. carpentry with
     its placeholder picture, is saved as a draft until the college adds its courses. */
  const groupsWithCourses = new Set(design.courses.map((c) => c.group))
  const groupIds: Record<string, number> = {}
  for (const [i, g] of design.groups.entries()) {
    const image = await media(payload, g.image, g.name)
    const icon = await media(payload, g.icon, { ar: `رمز ${g.name.ar}`, he: `סמל ${g.name.he}` })
    groupIds[g.slug] = await upsert(
      payload,
      'course-groups',
      g.slug,
      (l) => ({
        name: pick(g.name, l),
        shortName: pick(g.short, l),
        tagline: pick(g.tagline, l),
        image,
        icon,
        order: i + 1,
      }),
      { draft: !groupsWithCourses.has(g.slug) },
    )
  }

  /* courses */
  const courseIds: Record<string, number> = {}
  for (const [i, c] of design.courses.entries()) {
    const f = courseFacts[c.slug]
    const coverImage = await media(payload, c.image, c.name)
    courseIds[c.slug] = await upsert(payload, 'courses', c.slug, (l) => ({
      name: pick(c.name, l),
      group: groupIds[c.group],
      shortDescription: pick(c.summary, l),
      hours: c.hours,
      sessions: c.sessions,
      schedule: [...f.schedule],
      scheduleDetails: pick(f.scheduleDetails, l),
      certificate: pick(f.certificate, l),
      certifyingBody: pick(f.certifyingBody, l),
      certificateValue: f.certificateValue ? pick(f.certificateValue, l) : undefined,
      admission: {
        age: f.admission?.age ? pick(f.admission.age, l) : undefined,
        experience: f.admission?.experience ? pick(f.admission.experience, l) : undefined,
      },
      voucherEligible: true,
      featured: Boolean(c.featured),
      coverImage,
      order: i + 1,
    }))
  }
  for (const [slug, group] of Object.entries(extraCourseGroups)) {
    const name = design.courseNames[slug]
    courseIds[slug] = await upsert(
      payload,
      'courses',
      slug,
      (l) => ({ name: pick(name, l), group: groupIds[group], voucherEligible: true, order: 50 }),
      { draft: true },
    )
  }

  /* graduates → success stories */
  const storyIds: number[] = []
  for (const [i, g] of design.graduates.entries()) {
    const story = A.stories.find((s) => s.graduate === g.slug)
    const photo = await media(payload, g.image, g.name)
    const id = await upsert(payload, 'success-stories', g.slug, (l) => ({
      graduateName: pick(g.name, l),
      course: courseIds[g.course],
      photo,
      quote: story ? pick(story.quote, l) : undefined,
      excerpt: story ? pick(story.body, l) : undefined,
      currentRole: story ? pick(story.now, l) : undefined,
      videoDuration: story?.dur,
      featured: Boolean(story),
      order: i + 1,
    }))
    if (story) storyIds.push(id)
  }

  /* staff */
  for (const [i, s] of design.staff.entries()) {
    const photo = await media(payload, s.image, s.name)
    await upsert(payload, 'staff', s.slug, (l) => ({
      name: pick(s.name, l),
      role: pick(s.role, l),
      bio: A.bios[s.slug] ? pick(A.bios[s.slug], l) : undefined,
      photo,
      order: i + 1,
    }))
  }

  /* partners */
  for (const [i, p] of design.partners.entries()) {
    const logoId = await media(payload, p.image, {
      ar: `شعار ${p.name.ar}`,
      he: `הלוגו של ${p.name.he}`,
    })
    await upsert(payload, 'partners', p.slug, (l) => ({
      name: pick(p.name, l),
      logo: logoId,
      order: i + 1,
    }))
  }

  /* news */
  for (const n of design.news) {
    const coverImage = await media(payload, n.image, n.title)
    await upsert(payload, 'news', n.slug, (l) => ({
      title: pick(n.title, l),
      excerpt: pick(n.excerpt, l),
      kind: 'news',
      publishedAt: new Date(`${n.date}T12:00:00Z`).toISOString(),
      coverImage,
    }))
  }

  /* gallery page */
  const galleryImages: number[] = []
  for (const [i, src] of design.gallery.entries())
    galleryImages.push(await media(payload, src, galleryAlt(i)))
  const videoThumbs: Record<string, number> = {}
  for (const v of design.videos) videoThumbs[v.id] = await media(payload, v.thumb, v.title)
  await fillGlobal(
    payload,
    'gallery',
    (d) => Boolean((d.images as unknown[])?.length),
    (l) => ({
      title: D[l].home.galleryTitle,
      intro: D[l].home.galleryText,
      images: galleryImages,
      videos: design.videos.map((v) => ({
        title: pick(v.title, l),
        youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
        thumbnail: videoThumbs[v.id],
      })),
    }),
  )

  /* site settings */
  await fillGlobal(
    payload,
    'site-settings',
    (d) => Boolean(d.siteName && d.logoLight),
    (l) => ({
      siteName: pick(site.name, l),
      shortName: pick(site.shortName, l),
      city: pick(site.city, l),
      tagline: D[l].hero.slogan,
      accreditation: D[l].hero.badge,
      foundedYear: site.foundedYear,
      logoLight: logo,
      logoDark: logoWhite,
      contact: {
        phones: [
          { label: l === 'ar' ? 'المكتب' : 'משרד', number: site.phone, showInHeader: true },
          {
            label: l === 'ar' ? 'موبايل / واتساب' : 'נייד / וואטסאפ',
            number: site.mobile,
            showInHeader: false,
          },
        ],
        whatsapp: site.whatsappUrl.replace(/\D/g, ''),
        whatsappMessage:
          l === 'ar'
            ? 'مرحباً، بدي أستفسر عن الدورات في كلية المركز'
            : 'שלום, אשמח לקבל פרטים על הקורסים במכללת המרכז',
        email: site.email,
        address: pick(site.address, l),
        openingHours: [
          {
            days: pick(site.hours, l).split(' · ')[0],
            hours: pick(site.hours, l).split(' · ')[1] ?? '',
          },
        ],
      },
      social: [
        { platform: 'facebook', url: site.facebook },
        { platform: 'youtube', url: site.youtube },
      ],
      seo: {
        titleTemplate: `%s | ${pick(site.name, l)}`,
        defaultTitle: `${pick(site.name, l)} — ${pick(site.city, l)}`,
        defaultDescription: D[l].hero.text,
        ogImage: poster,
      },
    }),
  )

  /* header + footer */
  const groupLinks = design.groups.map((g) => ({ g }))
  await fillGlobal(
    payload,
    'navigation',
    (d) => Boolean((d.header as { items?: unknown[] })?.items?.length),
    (l) => ({
      header: {
        items: A.headerLinks.map((h) => ({
          label: D[l].nav[h.nav],
          link: A.navLink(h),
        })),
        cta: {
          show: true,
          label: D[l].common.registerInterest,
          link: { type: 'anchor', anchor: 'register' },
        },
      },
      footer: {
        about: D[l].footer.aboutText,
        columns: [
          {
            title: D[l].footer.coursesTitle,
            links: groupLinks.map(({ g }) => ({
              label: pick(g.name, l),
              link: { type: 'courseGroup', courseGroup: groupIds[g.slug] },
            })),
          },
          {
            title: D[l].footer.quickLinks,
            links: A.quickLinks.map((h) => ({
              label: D[l].nav[h.nav],
              link: A.navLink(h),
            })),
          },
        ],
        contactTitle: D[l].footer.contactTitle,
        copyright: `© {year} ${pick(site.name, l)} · ${D[l].footer.rights}`,
        bottomLinks: [
          { label: D[l].footer.accessibility, link: { type: 'page', page: 'accessibility' } },
        ],
      },
    }),
  )

  /* fixed texts */
  await fillGlobal(
    payload,
    'ui-texts',
    (d) => Boolean((d.nav as { home?: string })?.home),
    (l) => {
      const d = D[l]
      return {
        otherLang: d.otherLang,
        a11y: d.a11y,
        nav: d.nav,
        pageTitles: { graduatesTitle: d.home.graduatesTitle },
        common: { ...d.common, whatsappContact: d.hero.ctaWhatsapp },
        stats: d.stats,
        trust: d.trust,
        form: {
          ...d.form,
          error:
            l === 'ar'
              ? 'صار خطأ. تأكد من رقم الهاتف وحاول مرة ثانية، أو راسلنا على واتساب.'
              : 'משהו השתבש. בדקו את מספר הטלפון ונסו שוב, או כתבו לנו בוואטסאפ.',
        },
        course: { contactForPrice: d.course.contactForPrice },
      }
    },
  )

  /* homepage — the 13 sections of design Option A, in order */
  const promoVideo = await media(payload, 'assets/college-clip.mp4', A.videos.promoTitle)
  await fillGlobal(
    payload,
    'homepage',
    (d) => Boolean((d.sections as unknown[])?.length),
    (l) => {
      const d = D[l]
      return {
        sections: [
          {
            blockType: 'hero',
            video: heroVideo,
            poster,
            badge: d.hero.badge,
            title: d.hero.title,
            kicker: d.hero.kicker,
            text: d.hero.text,
            subtitle: d.hero.subtitle,
            slogan: d.hero.slogan,
            whatsappButton: d.common.whatsapp,
            registerButton: d.common.registerInterest,
            coursesLink: d.hero.ctaCourses,
            scrollHint: d.hero.scrollHint,
            showGroupsStrip: true,
            anchor: 'top',
          },
          {
            blockType: 'stats',
            items: A.stats.map((s) => ({
              value: design.counts[s.key],
              suffix: '+',
              label: d.stats[s.label],
              anchor: s.anchor,
            })),
            anchor: 'stats',
          },
          {
            blockType: 'courseGroups',
            kicker: d.nav.courses,
            title: d.home.groupsTitle,
            subtitle: d.home.groupsSubtitle,
            swipeHint: d.home.swipeHint,
            anchor: 'fields',
          },
          {
            blockType: 'featuredCourses',
            kicker: d.home.coursesSubtitle,
            title: d.home.coursesTitle,
            allCoursesButton: d.common.allCourses,
            anchor: 'courses',
          },
          {
            blockType: 'why',
            kicker: d.nav.about,
            title: d.home.whyTitle,
            items: d.home.whyItems,
            image: aboutImage,
            pills: [1, 2, 3].map((i) => ({ text: d.trust[i].title })),
            badgeNumber: String(site.foundedYear),
            badgeText: d.trust[0].text,
            anchor: 'why',
          },
          {
            blockType: 'successStories',
            kicker: d.nav.graduates,
            title: pick(A.storiesSection.title, l),
            subtitle: d.home.graduatesSubtitle,
            videoLabel: pick(A.storiesSection.videoLabel, l),
            stories: storyIds,
            rotateSeconds: 6.5,
            anchor: 'graduates',
          },
          {
            blockType: 'staff',
            kicker: d.nav.staff,
            title: d.home.staffTitle,
            subtitle: d.home.staffSubtitle,
            anchor: 'staff',
          },
          {
            blockType: 'videos',
            kicker: pick(A.videos.kicker, l),
            title: d.home.videoTitle,
            subtitle: pick(A.videos.subtitle, l),
            promo: {
              video: promoVideo,
              poster: videoThumbs[design.videos[0].id],
              durationLabel: A.videos.promoDuration,
              kind: pick(A.videos.promoKind, l),
              title: pick(A.videos.promoTitle, l),
              subtitle: pick(A.videos.promoSub, l),
              playLabel: pick(A.videos.playLabel, l),
            },
            reels: A.videos.reels.map((r) => ({
              title: pick(r.title, l),
              poster: mediaCache.get(design.courses.find((c) => c.slug === r.course)!.image),
              durationLabel: r.dur,
              course: courseIds[r.course],
            })),
            whatsappMessage: pick(A.videos.detailMsg, l),
            swipeHint: pick(A.videos.swipe, l),
            anchor: 'video',
          },
          {
            blockType: 'news',
            kicker: d.nav.news,
            title: d.home.newsTitle,
            count: 3,
            anchor: 'news',
          },
          { blockType: 'partners', title: d.home.partnersTitle, anchor: 'partners' },
          {
            blockType: 'employers',
            kicker: 'B2B',
            title: d.home.employersTitle,
            text: d.home.employersText,
            items: d.home.employersItems,
            whatsappButton: d.common.whatsappLong,
            hiringButton: d.home.hiringTitle,
            hiringText: d.home.hiringText,
            anchor: 'employers',
          },
          {
            blockType: 'faq',
            kicker: 'FAQ',
            title: d.home.faqTitle,
            text: d.home.faqText,
            items: d.faq.map((f: { q: string; a: string }) => ({ question: f.q, answer: f.a })),
            anchor: 'faq',
          },
          {
            blockType: 'register',
            kicker: d.common.registerInterest,
            title: d.home.ctaTitle,
            text: d.home.ctaText,
            showVoucherNote: true,
            bullets: [{ text: d.course.contactForPrice }, { text: d.common.nextStart }],
            whatsappButton: d.common.whatsappLong,
            anchor: 'register',
          },
        ],
      }
    },
  )
}

const payload = await getPayload({ config })
try {
  await run(payload)
  payload.logger.info('✅ Seed finished')
  process.exit(0)
} catch (err) {
  payload.logger.error(err)
  process.exit(1)
}
