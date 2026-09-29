'use client'

import { useEffect } from 'react'

/**
 * Payload كاتب كم رسالة بالإنجليزي جوّا الكود (مش بملفات الترجمة)، مثل
 * «Successfully saved 2 files» بعد رفع كم صورة مرة وحدة. هون منبدّلها بالعربي
 * لحظة ما تطلع (بس جوّا رسائل التنبيه الصغيرة).
 */
const FIELD_NAMES: Record<string, string> = {
  email: 'البريد الإلكتروني (غالباً في حساب ثاني بنفس الإيميل)',
  password: 'كلمة المرور',
  alt: 'وصف الصورة',
  filename: 'اسم الملف',
}

const RULES: [RegExp, (...m: string[]) => string][] = [
  [/^Successfully saved (\d+) files?\.?$/, (_, n) => `انحفظ ${n} ملفات ✓`],
  [/^Failed to save (\d+) files?\.?$/, (_, n) => `ما انحفظ ${n} ملفات — شوف الخانات المعلّمة بالأحمر (غالباً وصف الصورة ناقص).`],
  [
    /^The following fields? (?:is|are) invalid(?: \(\d+\))?:\s*(.*)$/,
    (_, list) => `في خانة لازم تصلّحها: ${list.split(/,\s*/).map((f) => FIELD_NAMES[f] ?? f).join('، ')}`,
  ],
  // Payload بيكتب أحياناً اسم الخانة التقني (email) بعد الجملة العربية
  [
    /^(في (?:خانة|خانات) لازم تصلّحها:)\s*((?:email|password|alt|filename)(?:,\s*(?:email|password|alt|filename))*)$/,
    (_, lead, list) => `${lead} ${list.split(/,\s*/).map((f) => FIELD_NAMES[f] ?? f).join('، ')}`,
  ],
  [/^To reorder the rows you must first sort them by the/, () => 'لتغيير الترتيب بالسحب لازم أول ترتّب الجدول حسب عمود «الترتيب».'],
]

function fix(root: ParentNode) {
  // «جدولة النشر» (الأخبار): خيار اللغة مكتوب «All» جوّا Payload (مش بملفات الترجمة)
  root.querySelectorAll?.('.schedule-publish .rs__single-value, .schedule-publish .rs__option').forEach((el) => {
    const node = el.firstChild
    if (node?.nodeType === Node.TEXT_NODE && node.nodeValue === 'All')
      node.nodeValue = document.documentElement.lang === 'he' ? 'כל השפות' : 'كل اللغات'
  })
  // المعاينة الحيّة: حجم «Responsive» (بعرض اللوحة) مكتوب جوّا Payload
  root.querySelectorAll?.('.live-preview-toolbar-controls *, .popup__content button').forEach((el) => {
    const node = el.firstChild
    if (node?.nodeType === Node.TEXT_NODE && node.nodeValue === 'Responsive' && el.childNodes.length === 1)
      node.nodeValue = document.documentElement.lang === 'he' ? 'לפי רוחב המסך' : 'حسب عرض الشاشة'
  })
  // عنوان عمود الساعات بمنتقي التاريخ مكتوب «Time»
  root.querySelectorAll?.('.react-datepicker-time__header').forEach((el) => {
    const node = el.firstChild
    if (node?.nodeType === Node.TEXT_NODE && node.nodeValue === 'Time')
      node.nodeValue = document.documentElement.lang === 'he' ? 'שעה' : 'الساعة'
  })
  root.querySelectorAll?.('[data-sonner-toast]').forEach((toast) => {
    // «في خانة لازم تصلّحها: <span>email</span>» — اسم الخانة التقني بعنصر لحاله
    toast.querySelectorAll('[data-testid="field-error"]').forEach((el) => {
      const name = el.textContent?.trim() ?? ''
      // بنغيّر نص العقدة نفسها (مش textContent) حتى ما نخربط على React
      if (FIELD_NAMES[name] && el.firstChild?.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = FIELD_NAMES[name]
    })
    const close = toast.querySelector('button[aria-label="Close toast"]')
    if (close) close.setAttribute('aria-label', 'إغلاق')
    const walker = document.createTreeWalker(toast, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.nodeValue?.trim() ?? ''
      if (!/[A-Za-z]{4}/.test(text)) continue
      for (const [re, to] of RULES) {
        const m = text.match(re)
        if (m) {
          n.nodeValue = to(...m)
          break
        }
      }
    }
  })
}

export function useArabicToasts() {
  useEffect(() => {
    const observer = new MutationObserver(() => fix(document))
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])
}
