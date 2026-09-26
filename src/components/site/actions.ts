'use server'

import { getPayloadClient, isLocale } from './data'

export type LeadState = { ok: boolean; error?: boolean }

/** «سجّل اهتمامك» → saved in the «leads» list + email to the college (hook in collections/Leads). */
export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const get = (k: string) => String(form.get(k) ?? '').trim()
  const locale = get('locale')
  const course = Number(get('course'))
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'leads',
      overrideAccess: false,
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
    return { ok: false, error: true }
  }
}
