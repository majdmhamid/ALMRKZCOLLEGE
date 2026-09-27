import 'server-only'

import { headers } from 'next/headers'

import { rateLimit } from '@/features/signing/server/rate-limit'

/**
 * Light spam protection for the «سجّل اهتمامك» form (on top of the hidden honeypot field).
 * Rule of thumb: when unsure, let the lead through — a lost student is worse than a spam row.
 */

/** At most 5 submissions per 10 minutes from the same IP. */
export const LEAD_RATE = { max: 5, windowSeconds: 10 * 60 }

/** A person needs more than this to type a name and a phone number. */
export const MIN_FILL_MS = 3000

/**
 * `elapsed` = milliseconds between the form showing up and «send», measured in the
 * browser (so the visitor's clock doesn't matter). Missing or odd values — no JavaScript,
 * old browser — are treated as fine.
 */
export function isTooFast(elapsed: string): boolean {
  if (!/^\d{1,9}$/.test(elapsed)) return false
  return Number(elapsed) < MIN_FILL_MS
}

/** Best-effort client IP (Vercel sets x-forwarded-for / x-real-ip). */
export async function clientIp(): Promise<string | null> {
  const h = await headers()
  const raw = (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '').trim()
  const ip = raw.replace(/^::ffff:/i, '')
  return /^[0-9a-f:.]{2,45}$/i.test(ip) ? ip : null
}

const memory = new Map<string, { windowStart: number; hits: number }>()
let warned = false

/** Per-instance fallback (on Vercel each serverless instance has its own memory → best effort). */
function memoryRateOk(key: string): boolean {
  const windowStart = Math.floor(Date.now() / 1000 / LEAD_RATE.windowSeconds)
  if (memory.size > 5000) memory.clear()
  const entry = memory.get(key)
  const hits = entry && entry.windowStart === windowStart ? entry.hits + 1 : 1
  memory.set(key, { windowStart, hits })
  return hits <= LEAD_RATE.max
}

/**
 * true = the lead may be saved. Unknown IP → allowed.
 * Reuses the signing app's limiter: Postgres-backed when Supabase is set up (shared by all
 * serverless instances), in memory locally. If that fails, falls back to this instance's memory.
 */
export async function leadRateOk(ip: string | null): Promise<boolean> {
  if (!ip) return true
  const key = `lead:ip:${ip}`
  try {
    return await rateLimit(key, LEAD_RATE.windowSeconds, LEAD_RATE.max)
  } catch (err) {
    if (!warned) {
      warned = true
      console.warn('Lead rate limit: shared limiter unavailable, using in-memory limit', err)
    }
    return memoryRateOk(key)
  }
}
