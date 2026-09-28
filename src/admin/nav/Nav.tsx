import { NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { Logout } from '@payloadcms/ui'
import Image from 'next/image'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import React from 'react'

import mark from '../logo-mark.png'
import { NavLinks, type NavGroup } from './NavLinks'
import { navCounts } from './counts'

/**
 * القائمة الجانبية للوحة التحكم — بنفس فكرة موقع الكلية:
 * مجموعات واضحة، أيقونة لكل قسم، وعدد العناصر (وتنبيه أحمر للطلبات والتوقيعات الجديدة).
 */
export async function Nav(props: ServerProps & { visibleEntities?: { collections: string[]; globals: string[] } }) {
  const { payload, user, visibleEntities } = props
  if (!payload) return null
  const can = (slug: string) =>
    !visibleEntities || visibleEntities.collections.includes(slug) || visibleEntities.globals.includes(slug)
  const counts = await navCounts(payload)
  const isAdmin = Boolean((user as { roles?: string[] } | null)?.roles?.includes('admin'))

  const groups: NavGroup[] = [
    { items: [{ href: '/admin', label: 'الرئيسية', icon: 'home', exact: true }] },
    {
      title: 'محتوى الموقع',
      items: [
        { href: '/admin/globals/homepage', label: 'الصفحة الرئيسية للموقع', icon: 'layout', show: can('homepage') },
        { href: '/admin/collections/courses', label: 'الدورات', icon: 'book', count: counts.courses, show: can('courses') },
        { href: '/admin/collections/course-groups', label: 'مجالات الدورات', icon: 'layers', count: counts.groups, show: can('course-groups') },
        { href: '/admin/collections/success-stories', label: 'الخريجون', icon: 'users', count: counts.stories, show: can('success-stories') },
        { href: '/admin/collections/news', label: 'الأخبار', icon: 'news', count: counts.news, show: can('news') },
        { href: '/admin/collections/staff', label: 'الطاقم', icon: 'user', count: counts.staff, show: can('staff') },
        { href: '/admin/collections/partners', label: 'الشركاء', icon: 'handshake', count: counts.partners, show: can('partners') },
        { href: '/admin/globals/gallery', label: 'معرض الصور والفيديو', icon: 'images', show: can('gallery') },
        { href: '/admin/collections/media', label: 'مكتبة الصور والفيديو', icon: 'folder', show: can('media') },
      ],
    },
    {
      title: 'التوقيع الإلكتروني',
      items: [
        { href: '/admin/documents', label: 'المستندات', icon: 'sign', count: counts.docsWaiting, alert: counts.docsUnread },
        { href: '/admin/signed', label: 'المستندات الموقّعة', icon: 'signed' },
        { href: '/admin/settings', label: 'إعدادات التوقيع', icon: 'settings' },
      ],
    },
    {
      title: 'الطلبات',
      items: [
        { href: '/admin/collections/leads', label: 'طلبات «سجّل اهتمامك»', icon: 'inbox', count: counts.leads, alert: counts.newLeads, show: can('leads') },
      ],
    },
    {
      title: 'إعدادات الموقع',
      items: [
        { href: '/admin/globals/site-settings', label: 'معلومات الكلية', icon: 'building', show: can('site-settings') },
        { href: '/admin/globals/navigation', label: 'القائمة والتذييل', icon: 'menu', show: can('navigation') },
        { href: '/admin/globals/ui-texts', label: 'نصوص الموقع الثابتة', icon: 'type', show: can('ui-texts') },
        { href: '/admin/collections/users', label: 'المستخدمون', icon: 'shield', show: isAdmin && can('users') },
      ],
    },
  ]

  return (
    <NavWrapper baseClass="nav">
      <nav className="almrkz-nav" aria-label="لوحة التحكم">
        <Link href="/admin" className="almrkz-nav__brand">
          <Image src={mark} alt="" width={44} height={44} style={{ objectFit: 'contain', padding: 6 }} />
          <span>
            <strong>كلية المركز</strong>
            <small>لوحة التحكم</small>
          </span>
        </Link>
        <NavLinks groups={groups} />
        <div className="almrkz-nav__footer">
          <a href="/ar" target="_blank" rel="noopener" className="almrkz-nav__link">
            <span className="almrkz-nav__icon" aria-hidden="true">↗</span>
            <span className="almrkz-nav__label">فتح الموقع</span>
          </a>
          <div className="almrkz-nav__user">
            <Link href="/admin/account" className="almrkz-nav__account" title={`حسابي وكلمة السر (${user?.email ?? ''})`} prefetch={false}>
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
