/**
 * Fills an empty database with the starting content.   npm run seed
 *
 * Safe to run again: existing items (matched by slug) and already-filled
 * settings are left untouched, so editors' changes are never overwritten.
 */
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '../payload.config'
import * as data from './data'

type Locale = 'ar' | 'he'

async function seedAdmin(payload: Payload) {
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs > 0) return payload.logger.info('users: already exist — skipped')
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

async function seedSiteSettings(payload: Payload) {
  const current = await payload.findGlobal({
    slug: 'site-settings',
    locale: 'ar',
    fallbackLocale: false,
  })
  if (current.siteName) return payload.logger.info('site-settings: already filled — skipped')
  const s = data.siteSettings
  for (const locale of ['ar', 'he'] as Locale[]) {
    const existing =
      locale === 'ar' ? current : await payload.findGlobal({ slug: 'site-settings', locale })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale,
      data: {
        siteName: s.siteName[locale],
        shortName: s.shortName[locale],
        accreditation: s.accreditation[locale],
        foundedYear: s.foundedYear,
        contact: {
          ...existing.contact,
          address: s.address[locale],
          whatsappMessage: s.whatsappMessage[locale],
        },
        seo: { ...existing.seo, titleTemplate: s.titleTemplate[locale] },
      },
    })
  }
  payload.logger.info('site-settings: filled')
}

async function seedNavigation(payload: Payload) {
  const current = await payload.findGlobal({ slug: 'navigation', locale: 'ar', depth: 0 })
  if (current.header?.items?.length)
    return payload.logger.info('navigation: already filled — skipped')

  // Arabic first (creates the rows), then Hebrew texts on the same rows (matched by row id).
  const ar = await payload.updateGlobal({
    slug: 'navigation',
    locale: 'ar',
    depth: 0,
    data: {
      header: {
        items: data.menu.map((m) => ({
          label: m.label.ar,
          link: { type: 'page' as const, page: m.page as 'home' },
        })),
        cta: { show: true, label: data.ctaLabel.ar, link: { type: 'page', page: 'register' } },
      },
      footer: { copyright: data.copyright.ar },
    },
  })
  await payload.updateGlobal({
    slug: 'navigation',
    locale: 'he',
    depth: 0,
    data: {
      header: {
        items: (ar.header?.items ?? []).map((row, i) => ({ ...row, label: data.menu[i].label.he })),
        cta: { ...ar.header?.cta, label: data.ctaLabel.he },
      },
      footer: { ...ar.footer, copyright: data.copyright.he },
    },
  })
  payload.logger.info('navigation: filled')
}

async function findBySlug(payload: Payload, collection: 'course-groups' | 'courses', slug: string) {
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  return docs[0]
}

async function seedCourseGroups(payload: Payload) {
  const ids: Record<string, number> = {}
  for (const g of data.courseGroups) {
    const existing = await findBySlug(payload, 'course-groups', g.slug)
    if (existing) {
      ids[g.slug] = existing.id
      continue
    }
    const doc = await payload.create({
      collection: 'course-groups',
      locale: 'ar',
      data: { name: g.name.ar, slug: g.slug, order: g.order, _status: 'published' },
    })
    await payload.update({
      collection: 'course-groups',
      id: doc.id,
      locale: 'he',
      data: { name: g.name.he, _status: 'published' },
    })
    ids[g.slug] = doc.id
    payload.logger.info(`course-groups: created ${g.slug}`)
  }
  return ids
}

async function seedCourses(payload: Payload, groupIds: Record<string, number>) {
  for (const c of data.courses) {
    if (await findBySlug(payload, 'courses', c.slug)) continue
    const doc = await payload.create({
      collection: 'courses',
      locale: 'ar',
      draft: true,
      data: {
        name: c.name.ar,
        slug: c.slug,
        group: groupIds[c.group],
        order: c.order,
        _status: 'draft',
      },
    })
    await payload.update({
      collection: 'courses',
      id: doc.id,
      locale: 'he',
      draft: true,
      data: { name: c.name.he, _status: 'draft' },
    })
    payload.logger.info(`courses: created draft ${c.slug}`)
  }
}

const payload = await getPayload({ config })
try {
  await seedAdmin(payload)
  await seedSiteSettings(payload)
  await seedNavigation(payload)
  const groupIds = await seedCourseGroups(payload)
  await seedCourses(payload, groupIds)
  payload.logger.info('✅ Seed finished')
  process.exit(0)
} catch (err) {
  payload.logger.error(err)
  process.exit(1)
}
