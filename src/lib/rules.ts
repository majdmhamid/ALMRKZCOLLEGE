/**
 * Fixed rules of the college (see CLAUDE.md). These texts are NOT editable in
 * the admin panel on purpose — the website must always show them exactly.
 * Shared by the admin panel (help texts, validation) and the public website.
 */

export type SiteLocale = 'ar' | 'he'

/** Shown wherever employment / career guidance is mentioned. */
export const EMPLOYMENT_NOTICE: Record<SiteLocale, string> = {
  ar: 'الكلية تقدّم مرافقة وتوجيه مهني، ولا تلتزم بتأمين مكان عمل.',
  he: 'המכללה מעניקה ליווי והכוונה מקצועית, ואינה מתחייבת להשמה במקום עבודה.',
}

/** Shown on every course marked «ملائمة لمنحة (שובר)». */
export const VOUCHER_TEXT: Record<SiteLocale, string> = {
  ar: 'الدورة ملائمة للحصول على منحة — تواصل معنا للاستشارة.',
  he: 'הקורס מתאים לקבלת שובר הכשרה – צרו קשר לייעוץ.',
}

/** Approved way to talk about what happens after the course. */
export const APPROVED_EMPLOYMENT_WORDING =
  'الصياغة المسموحة فقط: «مرافقة وتوجيه مهني بعد التخرّج» — مثل: توجيه عن سوق العمل، الشركات، والفرص. ' +
  'ممنوع: «ضمان تشغيل»، «شغل مضمون»، «بنشغّلك بعد الدورة»، «הבטחת תעסוקה». ' +
  'الموقع يعرض تلقائياً التنويه: «' +
  EMPLOYMENT_NOTICE.ar +
  '»'

type ForbiddenRule = { pattern: RegExp; reason: string }

/**
 * Wording that is never allowed anywhere in the content.
 * Checked on save in every collection and global (see hooks/enforceContentRules).
 */
export const FORBIDDEN_WORDING: ForbiddenRule[] = [
  // Job promises — Arabic
  { pattern: /ضمان\s*(ال)?(تشغيل|عمل|وظيفة|شغل)/u, reason: 'وعد بالتشغيل' },
  { pattern: /(تشغيل|عمل|وظيفة|شغل)\s*(ال)?مضمون/u, reason: 'وعد بالتشغيل' },
  {
    pattern: /(نضمن|بنضمن|نضمنلك|منضمن)\s*(لك|لكم)?\s*(ال)?(عمل|شغل|وظيفة|تشغيل)/u,
    reason: 'وعد بالتشغيل',
  },
  { pattern: /(بنشغّ?لك|نشغّ?لك|بنوظّ?فك|نوظّ?فك)/u, reason: 'وعد بالتشغيل' },
  // Job promises — Hebrew
  { pattern: /הבטחת\s*(ה)?(תעסוקה|עבודה|השמה)/u, reason: 'הבטחת תעסוקה' },
  { pattern: /(תעסוקה|עבודה|השמה)\s*מובטחת/u, reason: 'הבטחת תעסוקה' },
  { pattern: /(מבטיחים|מובטח(ת)?)\s*(לך|לכם)?\s*(ה)?(עבודה|תעסוקה|השמה)/u, reason: 'הבטחת תעסוקה' },
  { pattern: /השמה\s*(מלאה|מובטחת|100%)/u, reason: 'הבטחת תעסוקה' },
  // Prices are never shown on the site
  { pattern: /₪/u, reason: 'سعر' },
  { pattern: /\d[\d,.]*\s*(شيكل|شيقل|ش\.ج|ש["״']ח|שקלים|ש"ח|NIS|ILS)/iu, reason: 'سعر' },
  { pattern: /(سعر|تكلفة|رسوم)\s*(الدورة|الدوره|التسجيل)\s*[:：]?\s*\d/u, reason: 'سعر' },
  { pattern: /(מחיר|עלות)\s*(ה)?(קורס|לימודים)\s*[:：]?\s*\d/u, reason: 'سعر' },
]

export function findForbiddenWording(text: string): ForbiddenRule | undefined {
  return FORBIDDEN_WORDING.find((rule) => rule.pattern.test(text))
}

export function forbiddenWordingMessage(rule: ForbiddenRule, match: string): string {
  if (rule.reason === 'سعر') {
    return `لا يُسمح بكتابة أسعار على الموقع («${match}»). الطالب يتواصل مع الكلية لمعرفة السعر.`
  }
  return (
    `هذه الصياغة ممنوعة لأنها توحي بضمان عمل: «${match}». ` +
    'استعمل «مرافقة وتوجيه مهني بعد التخرّج» بدلاً منها.'
  )
}
