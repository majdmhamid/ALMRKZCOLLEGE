import config from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { hasRole } from '@/access'
import { purgeOldLeads } from '@/lib/leads-retention'

/**
 * Deletes «سجّل اهتمامك» requests older than the retention period set in site settings
 * (privacy law: no personal data kept longer than needed).
 *
 * Who may call it:
 * - the Vercel cron (vercel.json), which sends `Authorization: Bearer <CRON_SECRET>`;
 * - a logged-in admin, from the «احذف الطلبات القديمة الآن» button in the admin panel
 *   (Payload's login cookie; its CSRF check compares the Origin with NEXT_PUBLIC_SERVER_URL).
 */
async function allowed(request: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`) return true
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return hasRole(user as { roles?: ('admin' | 'editor')[] | null } | null, 'admin')
}

async function run(request: Request) {
  if (!(await allowed(request))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const payload = await getPayload({ config })
  const result = await purgeOldLeads(payload)
  return NextResponse.json(result, { headers: { 'cache-control': 'no-store' } })
}

export const GET = run
export const POST = run
