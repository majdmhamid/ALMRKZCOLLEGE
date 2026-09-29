import { NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { Logout } from '@payloadcms/ui'
import Image from 'next/image'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import React from 'react'

import { hasRole } from '@/access'

import { adminLang, shellText } from '../i18n'
import mark from '../logo-mark.png'
import { NavLinks, type NavGroup } from './NavLinks'
import { navCounts } from './counts'

/**
 * القائمة الجانبية للوحة التحكم — بنفس فكرة موقع الكلية:
 * مجموعات واضحة، أيقونة لكل قسم، وعدد العناصر (وتنبيه أحمر للطلبات والتوقيعات الجديدة).
 */
export async function Nav(props: ServerProps & { visibleEntities?: { collections: string[]; globals: string[] } }) {
  const { i18n, payload, permissions, user, visibleEntities } = props
  const lang = adminLang(i18n)
  const t = shellText(lang).nav
  if (!payload) return null
  // Shown only when the section isn't hidden AND this user may open it (an editor has no access
  // to the leads or the users — the link, and its count, must not show up for them).
  const can = (slug: string) => {
    const visible =
      !visibleEntities || visibleEntities.collections.includes(slug) || visibleEntities.globals.includes(slug)
    const allowed = permissions ? Boolean(permissions.collections?.[slug]?.read || permissions.globals?.[slug]?.read) : true
    return visible && allowed
  }
  const isAdmin = hasRole(user as never, 'admin')
  const counts = await navCounts(payload, { leads: can('leads'), signing: isAdmin })

  const groups: NavGroup[] = [
    { items: [{ href: '/admin', label: t.home, icon: 'home', exact: true }] },
    {
      title: t.content,
      items: [
        { href: '/admin/globals/homepage', label: t.homepage, icon: 'layout', show: can('homepage') },
        { href: '/admin/collections/courses', label: t.courses, icon: 'book', count: counts.courses, show: can('courses') },
        { href: '/admin/collections/course-groups', label: t.groups, icon: 'layers', count: counts.groups, show: can('course-groups') },
        { href: '/admin/collections/success-stories', label: t.stories, icon: 'users', count: counts.stories, show: can('success-stories') },
        { href: '/admin/collections/news', label: t.news, icon: 'news', count: counts.news, show: can('news') },
        { href: '/admin/collections/staff', label: t.staff, icon: 'user', count: counts.staff, show: can('staff') },
        { href: '/admin/collections/partners', label: t.partners, icon: 'handshake', count: counts.partners, show: can('partners') },
        { href: '/admin/globals/gallery', label: t.gallery, icon: 'images', show: can('gallery') },
        { href: '/admin/collections/media', label: t.media, icon: 'folder', show: can('media') },
      ],
    },
    {
      title: t.signing,
      items: [
        { href: '/admin/documents', label: t.documents, icon: 'sign', count: counts.docsWaiting, alert: counts.docsUnread, show: isAdmin },
        { href: '/admin/signed', label: t.signed, icon: 'signed', show: isAdmin },
        { href: '/admin/settings', label: t.signingSettings, icon: 'settings', show: isAdmin },
      ],
    },
    {
      title: t.leadsGroup,
      items: [
        { href: '/admin/collections/leads', label: t.leads, icon: 'inbox', count: counts.leads, alert: counts.newLeads, show: can('leads') },
      ],
    },
    {
      title: t.settingsGroup,
      items: [
        { href: '/admin/globals/site-settings', label: t.siteSettings, icon: 'building', show: can('site-settings') },
        { href: '/admin/globals/navigation', label: t.navigation, icon: 'menu', show: can('navigation') },
        { href: '/admin/globals/ui-texts', label: t.uiTexts, icon: 'type', show: can('ui-texts') },
        { href: '/admin/collections/users', label: t.users, icon: 'shield', show: isAdmin && can('users') },
      ],
    },
  ]

  return (
    <NavWrapper baseClass="nav">
      <nav className="almrkz-nav" aria-label={t.aria}>
        <Link href="/admin" className="almrkz-nav__brand">
          <Image src={mark} alt="" width={44} height={44} style={{ objectFit: 'contain', padding: 6 }} />
          <span>
            <strong>{t.college}</strong>
            <small>{t.panel}</small>
          </span>
        </Link>
        <NavLinks groups={groups} newLabel={t.newBadge} closeLabel={t.close} />
        <div className="almrkz-nav__footer">
          <a href={`/${lang}`} target="_blank" rel="noopener" className="almrkz-nav__link">
            <span className="almrkz-nav__icon" aria-hidden="true">↗</span>
            <span className="almrkz-nav__label">{t.openSite}</span>
          </a>
          <div className="almrkz-nav__user">
            <Link href="/admin/account" className="almrkz-nav__account" title={`${t.account} (${user?.email ?? ''})`} prefetch={false}>
              {(user as { name?: string } | null)?.name || user?.email}
            </Link>
            <Logout />
          </div>
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__mobile-close">
          <NavHamburger />
        </div>
      </div>
    </NavWrapper>
  )
}
