import { NextResponse, type NextRequest } from 'next/server'

/**
 * بيعلّم الطلب إذا هو من صفحة التوقيع للعميل (/sign) أو من لوحة التحكم (/admin)،
 * حتى تنختار لغة نصوص التوقيع صح: اللوحة بالعربي، وصفحة العميل حسب لغة جواله.
 * (الدخول نفسه بتفحصه لوحة التحكم — هون ما في أي فحص.)
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-app-area', request.nextUrl.pathname.startsWith('/sign') ? 'sign' : 'admin')
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/admin/:path*', '/sign/:path*'],
}
