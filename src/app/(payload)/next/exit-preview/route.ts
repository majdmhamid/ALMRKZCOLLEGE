import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { isSitePath } from '@/lib/preview'

/** Leaves preview mode and shows the published version of the page. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') || '/'
  const draft = await draftMode()
  draft.disable()
  redirect(isSitePath(path) ? path : '/')
}
