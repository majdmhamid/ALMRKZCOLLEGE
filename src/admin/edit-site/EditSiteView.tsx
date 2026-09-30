import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { EditSite, type PageOption } from './EditSite'
import './edit-site.scss'

/**
 * «عدّل الموقع» (/admin/edit-site): the real website inside the panel, in preview mode —
 * click a text, picture or video and change it right there. Changes stay drafts until «انشر».
 */
export async function EditSiteView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  const { payload, user } = req

  const pages: PageOption[] = [
    { path: '', label: 'الصفحة الرئيسية', group: 'صفحات' },
    { path: '/courses', label: 'كل الدورات', group: 'صفحات' },
    { path: '/news', label: 'الأخبار', group: 'صفحات' },
    { path: '/about', label: 'عن الكلية', group: 'صفحات' },
    { path: '/contact', label: 'اتصل بنا', group: 'صفحات' },
  ]
  if (user) {
    const opts = { draft: true, depth: 0, limit: 200, pagination: false, locale: 'ar', user, overrideAccess: false } as const
    const [groups, courses, news] = await Promise.all([
      payload.find({ collection: 'course-groups', sort: 'order', ...opts }).catch(() => ({ docs: [] })),
      payload.find({ collection: 'courses', sort: 'order', ...opts }).catch(() => ({ docs: [] })),
      payload.find({ collection: 'news', sort: '-publishedAt', ...opts }).catch(() => ({ docs: [] })),
    ])
    for (const g of groups.docs) if (g.slug) pages.push({ path: `/courses/${g.slug}`, label: g.name, group: 'مجالات' })
    for (const c of courses.docs) if (c.slug) pages.push({ path: `/course/${c.slug}`, label: c.name, group: 'دورات' })
    for (const n of news.docs) if (n.slug) pages.push({ path: `/news/${n.slug}`, label: n.title, group: 'أخبار' })
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={visibleEntities}
      viewType="dashboard"
    >
      {user ? (
        <EditSite pages={pages} />
      ) : (
        <p className="gutter--left gutter--right">لازم تسجّل دخول للوحة التحكم.</p>
      )}
    </DefaultTemplate>
  )
}
