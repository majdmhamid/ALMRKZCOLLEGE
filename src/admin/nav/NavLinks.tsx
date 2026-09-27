'use client'

import {
  BookOpen,
  Building2,
  FileCheck2,
  FileSignature,
  FolderOpen,
  Handshake,
  Home,
  Images,
  Inbox,
  Layers,
  LayoutTemplate,
  Menu,
  Newspaper,
  Settings,
  ShieldCheck,
  Type,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useNav, useWindowInfo } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  layout: LayoutTemplate,
  book: BookOpen,
  layers: Layers,
  users: Users,
  news: Newspaper,
  user: UserRound,
  handshake: Handshake,
  images: Images,
  folder: FolderOpen,
  inbox: Inbox,
  building: Building2,
  menu: Menu,
  type: Type,
  shield: ShieldCheck,
  sign: FileSignature,
  signed: FileCheck2,
  settings: Settings,
}

export type NavItem = {
  href: string
  label: string
  icon: keyof typeof ICONS
  count?: number
  /** رقم أحمر: شي جديد بدو انتباه (طلب جديد، توقيع وصل) */
  alert?: number
  exact?: boolean
  show?: boolean
}
export type NavGroup = { title?: string; items: NavItem[] }

export function NavLinks({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()
  const { setNavOpen } = useNav()
  const { breakpoints } = useWindowInfo()

  // Payload بيسكّر القائمة على أي شاشة أصغر من 1440px — على الكمبيوتر بدنا ياها مفتوحة دايماً
  useEffect(() => {
    const open = () => {
      if (window.innerWidth > 1024) setTimeout(() => setNavOpen(true), 0)
    }
    open()
    window.addEventListener('resize', open)
    return () => window.removeEventListener('resize', open)
    // Payload بيسكّرها كل ما تتغيّر مقاسات الشاشة — منرجع نفتحها بعده
  }, [setNavOpen, breakpoints.l, breakpoints.m])

  const active = (it: NavItem) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`))
  return (
    <div className="almrkz-nav__groups">
      {groups.map((g, i) => {
        const items = g.items.filter((it) => it.show !== false)
        if (!items.length) return null
        return (
          <div key={i} className="almrkz-nav__group">
            {g.title && <p className="almrkz-nav__title">{g.title}</p>}
            {items.map((it) => {
              const Icon = ICONS[it.icon] ?? Home
              return (
                <Link key={it.href} href={it.href} className="almrkz-nav__link" aria-current={active(it) ? 'page' : undefined} prefetch={false}>
                  <Icon size={18} className="almrkz-nav__icon" aria-hidden="true" />
                  <span className="almrkz-nav__label">{it.label}</span>
                  {!!it.alert && (
                    <span className="almrkz-nav__alert" title="جديد">
                      {it.alert}
                    </span>
                  )}
                  {it.count !== undefined && <span className="almrkz-nav__count">{it.count}</span>}
                </Link>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
