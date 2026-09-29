/**
 * Israeli ID number (ת.ז / رقم الهوية) helpers.
 *
 * The 9th digit is a check digit: multiply digits alternately by 1 and 2,
 * sum the digits of each product (i.e. subtract 9 when > 9), and the total
 * must be divisible by 10. Shorter numbers are left-padded with zeros.
 */

/**
 * Arabic-Indic (٠-٩) and Persian (۰-۹) digits → 0-9. Arabic phone keyboards often type
 * these in number fields; without this the ID looked empty/invalid to the signer.
 */
export function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/** Strips spaces/dashes and left-pads to 9 digits. Returns null if not 1–9 digits. */
export function normalizeIsraeliId(input: string): string | null {
  const digits = toAsciiDigits(input).replace(/[\s\-‐-―]/g, "");
  if (!/^\d{1,9}$/.test(digits)) return null;
  return digits.padStart(9, "0");
}

export function isValidIsraeliId(input: string): boolean {
  const id = normalizeIsraeliId(input);
  if (!id || /^0+$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

/** Last three digits of the normalized ID, for display ("•••••••23" style). */
export function idLast3(input: string): string | null {
  const id = normalizeIsraeliId(input);
  return id ? id.slice(-3) : null;
}
