/**
 * Turns the free text typed in the admin panel into the exact formats Google's structured data
 * (schema.org) expects. Anything that can't be understood is left out — never sent half-right.
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
type Day = (typeof DAYS)[number]

/** Day names in Arabic and Hebrew (and English), in week order starting Sunday. */
const DAY_NAMES: string[][] = [
  ['الأحد', 'الاحد', 'أحد', 'احد', 'ראשון', "יום א'", 'sunday', 'sun'],
  ['الاثنين', 'الإثنين', 'اثنين', 'إثنين', 'שני', "יום ב'", 'monday', 'mon'],
  ['الثلاثاء', 'ثلاثاء', 'שלישי', "יום ג'", 'tuesday', 'tue'],
  ['الأربعاء', 'الاربعاء', 'أربعاء', 'اربعاء', 'רביעי', "יום ד'", 'wednesday', 'wed'],
  ['الخميس', 'خميس', 'חמישי', "יום ה'", 'thursday', 'thu'],
  ['الجمعة', 'جمعة', 'שישי', "יום ו'", 'friday', 'fri'],
  ['السبت', 'سبت', 'שבת', 'saturday', 'sat'],
]

function dayIndex(word: string): number {
  const w = word.trim().replace(/^יום\s+/, '').toLowerCase()
  return DAY_NAMES.findIndex((names) => names.some((n) => n.toLowerCase() === w))
}

/** «الأحد – الخميس» → Sunday…Thursday; «الجمعة، السبت» → Friday, Saturday. Empty if unknown. */
export function parseDays(text: string): Day[] {
  const days = new Set<Day>()
  for (const part of text.split(/[,،+&]|\s+و\s*(?=\S)/)) {
    const range = part.split(/\s*(?:[-–—]|עד|حتى|إلى|الى)\s*/).filter(Boolean)
    if (range.length === 1) {
      const i = dayIndex(range[0])
      if (i < 0) return []
      days.add(DAYS[i])
    } else if (range.length === 2) {
      const a = dayIndex(range[0])
      const b = dayIndex(range[1])
      if (a < 0 || b < 0) return []
      for (let i = a; ; i = (i + 1) % 7) {
        days.add(DAYS[i])
        if (i === b) break
      }
    } else if (part.trim()) {
      return []
    }
  }
  return [...days]
}

const pad = (t: string) => {
  const [h, m] = t.split(':')
  return `${h.padStart(2, '0')}:${m}`
}

/**
 * The «ساعات الدوام» lines as schema.org `openingHoursSpecification`. A line counts only when
 * both its days and its hours («08:00 – 16:00») are clear; text like «تواصل معنا» is skipped.
 */
export function openingHoursSpecification(
  lines: { days?: string | null; hours?: string | null }[],
) {
  return lines.flatMap((line) => {
    const times = (line.hours ?? '').match(/\b\d{1,2}:\d{2}\b/g)
    if (!times || times.length !== 2) return []
    const days = parseDays(line.days ?? '')
    if (!days.length) return []
    return [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days.map((d) => `https://schema.org/${d}`),
        opens: pad(times[0]),
        closes: pad(times[1]),
      },
    ]
  })
}

/** Israeli phone number in international form: «04-6116800» → «+972-4-6116800». */
export function internationalPhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return phone.trim()
  if (digits.startsWith('972')) return `+972-${digits.slice(3)}`
  if (/^0\d{8,9}$/.test(digits)) {
    const rest = digits.slice(1)
    // Mobile / VoIP numbers have a 2-digit prefix (05x, 07x), landlines a 1-digit one (02–09).
    const cut = /^[57]/.test(rest) ? 2 : 1
    return `+972-${rest.slice(0, cut)}-${rest.slice(cut)}`
  }
  return phone.trim()
}
