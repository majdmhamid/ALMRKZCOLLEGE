import { NextResponse, type NextRequest } from 'next/server'

/** The only pages under /sign and /next (anything else there is unknown). */
const SIGN_PAGE = /^\/sign\/[^/]+(\/document)?\/?$/
const NEXT_PAGE = /^\/next\/(preview|exit-preview)\/?$/

/**
 * 1. بيعلّم الطلب إذا هو من صفحة التوقيع للعميل (/sign) أو من لوحة التحكم (/admin)،
 *    حتى تنختار لغة نصوص التوقيع صح: اللوحة بالعربي، وصفحة العميل حسب لغة جواله.
 *    (الدخول نفسه بتفحصه لوحة التحكم — هون ما في أي فحص.)
 * 2. عنوان مش موجود برّا /ar و /he (مثل /foo أو /sign/a/b/c) → صفحة 404 تبعت الموقع بالعربي
 *    بدل صفحة Next.js الإنجليزية. الرابط بضل نفسه والرد 404.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const isSign = pathname.startsWith('/sign/')
  if (!isAdmin && !(isSign && SIGN_PAGE.test(pathname)) && !NEXT_PAGE.test(pathname)) {
    // Shown by src/app/(frontend)/[locale]/[...missing] → [locale]/not-found.tsx
    return NextResponse.rewrite(new URL('/ar/__missing', request.url))
  }
  if (!isAdmin && !isSign) return NextResponse.next()
  const headers = new Headers(request.headers)
  headers.set('x-app-area', isSign ? 'sign' : 'admin')
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/sign/:path*',
    '/next/:path*',
    // Every other address outside the site's own sections — except Next.js internals (/_next…)
    // and files (anything with a dot: fonts, images, robots.txt, sitemap.xml…).
    '/((?!ar/|ar$|he/|he$|admin/|admin$|api/|api$|sign/|sign$|next/|next$|_)[^.]+)',
  ],
}
