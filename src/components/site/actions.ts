'use server'

import { getPayloadClient, isLocale } from './data'
import { clientIp, isTooFast, leadRateOk } from './lead-guard'

export type LeadValues = { name: string; phone: string; course: string; message: string }

export type LeadState = {
  ok: boolean
  error?: boolean
  /** Why the form was refused (shown as its own message); none = generic error. */
  reason?: 'too_fast' | 'rate_limited'
  /** What the visitor typed, so a refused form keeps it. */
  values?: LeadValues
}

/** «سجّل اهتمامك» → saved in the «leads» list + email to the college (hook in collections/Leads). */
export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const get = (k: string) => String(form.get(k) ?? '').trim()
  const locale = get('locale')
  const course = Number(get('course'))
  const values: LeadValues = {
    name: get('name').slice(0, 120),
    phone: get('phone').slice(0, 30),
    course: get('course').slice(0, 12),
    message: get('message').slice(0, 2000),
  }
  // Spam checks (the timing field `ft` is only read here — it is never stored).
  if (isTooFast(get('ft'))) return { ok: false, error: true, reason: 'too_fast', values }
  if (!(await leadRateOk(await clientIp())))
    return { ok: false, error: true, reason: 'rate_limited', values }
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'leads',
      // The REST API does not accept leads from visitors (only admins) — this form, after the
      // spam checks above, is the only public way in. Every field below is set here.
      overrideAccess: true,
      data: {
        name: get('name'),
        phone: get('phone'),
        course: Number.isFinite(course) && course > 0 ? course : undefined,
        message: get('message') || undefined,
        locale: isLocale(locale) ? locale : 'ar',
        sourcePage: get('sourcePage').slice(0, 300),
        website: get('website') || undefined,
        status: 'new',
      },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: true, values }
  }
}
