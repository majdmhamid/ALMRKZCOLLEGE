import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { safeRedirectPath } from '@/lib/preview'

/** Leaves preview mode and shows the published version of the page. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const draft = await draftMode()
  draft.disable()
  // Same-site paths only (no open redirect).
  redirect(safeRedirectPath(url.searchParams.get('path')) ?? '/')
}
