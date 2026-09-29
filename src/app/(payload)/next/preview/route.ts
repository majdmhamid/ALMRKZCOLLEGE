import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { isSitePath } from '@/lib/preview'

/**
 * Opened by the «معاينة» button and the live-preview panel in /admin.
 * Turns on Next.js draft mode for logged-in staff, then shows the page.
 * The website reads `(await draftMode()).isEnabled` and fetches with `draft: true`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') || '/'

  // Only same-site paths (no open redirect).
  if (!isSitePath(path)) {
    return new Response('Invalid path', { status: 400 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return new Response('يجب تسجيل الدخول إلى لوحة التحكم أولاً.', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
