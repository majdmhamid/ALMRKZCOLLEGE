'use client'

import { useEffect } from 'react'

/**
 * Payload كاتب كم رسالة بالإنجليزي جوّا الكود (مش بملفات الترجمة)، مثل
 * «Successfully saved 2 files» بعد رفع كم صورة مرة وحدة، أو «Invalid MIME type» تحت ملف
 * PDF. هون منبدّلها بلغة اللوحة (عربي، أو عبري إذا اللوحة بالعبري) لحظة ما تطلع — بس جوّا
 * رسائل التنبيه الصغيرة (toasts) وعلامات الخطأ جنب الخانات.
 */
type Lang = 'ar' | 'he'

const FIELD_NAMES: Record<Lang, Record<string, string>> = {
  ar: {
    email: 'البريد الإلكتروني (غالباً في حساب ثاني بنفس الإيميل)',
    password: 'كلمة المرور',
    alt: 'وصف الصورة',
    filename: 'اسم الملف',
    file: 'الملف',
  },
  he: {
    email: 'אימייל (כנראה יש כבר חשבון עם אותו אימייל)',
    password: 'סיסמה',
    alt: 'תיאור התמונה',
    filename: 'שם הקובץ',
    file: 'הקובץ',
  },
}

const fields = (lang: Lang, list: string) =>
  list
    .split(/,\s*/)
    .map((f) => FIELD_NAMES[lang][f] ?? f)
    .join(lang === 'he' ? ', ' : '، ')

const WRONG_FILE = {
  ar: 'هاد نوع الملف ما بينفع بمكتبة الصور. ارفع صورة (JPG أو PNG أو WEBP) أو فيديو MP4.',
  he: 'סוג הקובץ הזה לא מתאים לספריית התמונות. העלו תמונה (JPG, PNG או WEBP) או וידאו MP4.',
}

const RULES: [RegExp, (lang: Lang, ...m: string[]) => string][] = [
  [/^Successfully saved (\d+) files?\.?$/, (l, _, n) => (l === 'he' ? `${n} קבצים נשמרו ✓` : `انحفظ ${n} ملفات ✓`)],
  [
    /^Failed to save (\d+) files?\.?$/,
    (l, _, n) =>
      l === 'he'
        ? `${n} קבצים לא נשמרו — בדקו את השדות המסומנים באדום (בדרך כלל חסר תיאור לתמונה).`
        : `ما انحفظ ${n} ملفات — شوف الخانات المعلّمة بالأحمر (غالباً وصف الصورة ناقص).`,
  ],
  [
    /^The following fields? (?:is|are) invalid(?: \(\d+\))?:\s*(.*)$/,
    (l, _, list) => (l === 'he' ? `יש שדה לתקן: ${fields(l, list)}` : `في خانة لازم تصلّحها: ${fields(l, list)}`),
  ],
  // Payload بيكتب أحياناً اسم الخانة التقني (email) بعد الجملة العربية
  [
    /^(في (?:خانة|خانات) لازم تصلّحها:)\s*((?:email|password|alt|filename|file)(?:,\s*(?:email|password|alt|filename|file))*)$/,
    (l, _, lead, list) => `${lead} ${fields(l, list)}`,
  ],
  [
    /^To reorder the rows you must first sort them by the/,
    (l) =>
      l === 'he'
        ? 'כדי לשנות את הסדר בגרירה, קודם מיינו את הטבלה לפי עמודת «הסדר».'
        : 'لتغيير الترتيب بالسحب لازم أول ترتّب الجدول حسب عمود «الترتيب».',
  ],
  // رفع ملف مش صورة/فيديو (PDF، Word، نص…) لمكتبة الصور
  [/^(?:Invalid MIME type: .*|File type .* \(from extension .*\) is not allowed\.)(?:,\s*.*)?$/, (l) => WRONG_FILE[l]],
  [
    /^Invalid (?:or corrupted )?(?:ISO base media|PDF) file\.?$/,
    (l) => (l === 'he' ? 'הקובץ פגום ולא ניתן לפתוח אותו. נסו לשמור אותו מחדש ולהעלות שוב.' : 'الملف خربان وما بينفتح. جرّب تحفظه من جديد وترفعه كمان مرة.'),
  ],
  [
    /^SVG file contains potentially harmful content\.?$/,
    (l) => (l === 'he' ? 'בקובץ ה-SVG יש תוכן לא בטוח. שמרו אותו כ-PNG והעלו שוב.' : 'ملف الـ SVG فيه محتوى مش آمن. احفظه كـ PNG وارفعه من جديد.'),
  ],
]

function translate(el: Element, lang: Lang) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue?.trim() ?? ''
    if (!/[A-Za-z]{4}/.test(text)) continue
    for (const [re, to] of RULES) {
      const m = text.match(re)
      if (m) {
        n.nodeValue = to(lang, ...m)
        break
      }
    }
  }
}

function fix(root: ParentNode) {
  const lang: Lang = document.documentElement.lang === 'he' ? 'he' : 'ar'
  root.querySelectorAll?.('[data-sonner-toast]').forEach((toast) => {
    // «في خانة لازم تصلّحها: <span>email</span>» — اسم الخانة التقني بعنصر لحاله
    toast.querySelectorAll('[data-testid="field-error"]').forEach((el) => {
      const name = el.textContent?.trim() ?? ''
      // بنغيّر نص العقدة نفسها (مش textContent) حتى ما نخربط على React
      if (FIELD_NAMES[lang][name] && el.firstChild?.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = FIELD_NAMES[lang][name]
    })
    const close = toast.querySelector('button[aria-label="Close toast"]')
    if (close) close.setAttribute('aria-label', lang === 'he' ? 'סגירה' : 'إغلاق')
    translate(toast, lang)
  })
  // علامة الخطأ الحمرا جنب الخانة (مثلاً تحت الملف المرفوع)
  root.querySelectorAll?.('.field-error, .tooltip').forEach((el) => translate(el, lang))
}

export function useArabicToasts() {
  useEffect(() => {
    const observer = new MutationObserver(() => fix(document))
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])
}
