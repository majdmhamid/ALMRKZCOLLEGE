/**
 * Arabic-Indic (٠-٩) and Persian (۰-۹) digits → 0-9. Arabic phone keyboards often type
 * these in number fields.
 */
export function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/**
 * Phone numbers for WhatsApp links. Stored as international digits without "+"
 * (e.g. 972501234567), which is exactly what wa.me expects.
 * Local Israeli numbers (05X…, 0X…) get the 972 prefix.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = toAsciiDigits(input).trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
  if (!/^\d{7,15}$/.test(digits)) return null;
  // "9720501234567" (972 + a leading local 0) is a common paste mistake.
  if (digits.startsWith("9720")) digits = `972${digits.slice(4)}`;
  return digits;
}

/** Friendly display: 972501234567 → 050-123-4567; others → +<digits>. */
export function formatPhone(digits: string): string {
  if (/^9725\d{8}$/.test(digits)) {
    const local = `0${digits.slice(3)}`;
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return `+${digits}`;
}
