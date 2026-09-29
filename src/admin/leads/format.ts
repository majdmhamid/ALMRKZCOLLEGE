/**
 * Helpers for the leads screens (no React, so they are unit-tested: tests/leads-format.test.ts).
 */

/**
 * Any way a visitor types a phone → the digits wa.me wants (country code, no "+", no leading 0).
 *   050-1234567 / 0501234567 / 501234567 / +972 50 123 4567 / 00972… / 9720501234567 → 972501234567
 *   059… / 056… (Palestinian mobile, Jawwal / Ooredoo) → 97059… / 97056…
 */
export function toWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  // «972 050…» — a common paste mistake (country code + the local leading 0)
  if (/^97[02]0/.test(digits)) digits = digits.slice(0, 3) + digits.slice(4)
  if (/^97[02]/.test(digits)) return digits
  if (/^0(56|59)\d{7}$/.test(digits)) return `970${digits.slice(1)}`
  if (digits.startsWith('0')) return `972${digits.slice(1)}`
  // leading 0 forgotten: 501234567
  if (/^5\d{8}$/.test(digits)) return `972${digits}`
  return digits
}

/** Number for a tel: link — digits and a leading "+" only. */
export const toTel = (phone: string) => phone.replace(/[^\d+]/g, '')

/**
 * One CSV cell for Excel.
 * - A value from the public form that starts with = + - @ is a formula for Excel (someone could
 *   type «=HYPERLINK(…)» as their name). A leading apostrophe makes it plain text.
 * - Phone numbers: Excel drops the leading 0 (0501234567 → 501234567). ="…" keeps them as text.
 */
export function csvCell(value: unknown, kind: 'text' | 'phone' = 'text'): string {
  let s = String(value ?? '').replace(/\r?\n/g, ' ')
  if (kind === 'phone' && s.trim() && /^[\d\s+()-]+$/.test(s)) return `="${s.trim()}"`
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}
