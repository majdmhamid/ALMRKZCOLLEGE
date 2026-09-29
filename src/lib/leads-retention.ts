import type { Payload } from 'payload'

import { leadRetentionMonths } from '@/components/site/notice-text'

/**
 * Retention of «سجّل اهتمامك» requests (חוק הגנת הפרטיות: keep personal data no longer than
 * needed). The period comes from «معلومات الكلية ← الوصولية والخصوصية» and is also printed in the
 * privacy policy and under the form, so all three always agree.
 *
 * `purgeOldLeads` runs every night from the Vercel cron (/api/privacy/purge-leads) and from the
 * «احذف الطلبات القديمة الآن» button in the admin panel.
 */

/** Requests created before this date are older than the retention period. */
export function retentionCutoff(months: number, now = new Date()): Date {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months)
  return cutoff
}

export type PurgeResult = { months: number; cutoff: string; deleted: number }

export async function purgeOldLeads(payload: Payload, now = new Date()): Promise<PurgeResult> {
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
  const months = leadRetentionMonths(settings?.privacy?.leadsRetentionMonths)
  const cutoff = retentionCutoff(months, now)
  const { docs } = await payload.delete({
    collection: 'leads',
    where: { createdAt: { less_than: cutoff.toISOString() } },
    overrideAccess: true,
    depth: 0,
  })
  const deleted = docs.length
  if (deleted) payload.logger.info(`Privacy: deleted ${deleted} lead(s) older than ${months} months.`)
  return { months, cutoff: cutoff.toISOString(), deleted }
}
