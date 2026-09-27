'use client'

import { usePathname } from 'next/navigation'

import { NotFoundContent } from '@/components/site/not-found-content'

/** 404 inside /ar/... or /he/... — in the language of the address, with that language's links. */
export default function NotFound() {
  const locale = /^\/he(\/|$)/.test(usePathname() ?? '') ? 'he' : 'ar'
  return <NotFoundContent locale={locale} />
}
