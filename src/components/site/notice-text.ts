import type { SiteLocale } from '@/lib/rules'

/**
 * Legal notices shown where the website collects personal information. Kept in code (like the
 * legal pages) so they always say exactly what the privacy policy says, in both languages.
 *
 * - LEAD_NOTICE: the notice required by section 11 of the Privacy Protection Law (חוק הגנת
 *   הפרטיות, סעיף 11) under the «سجّل اهتمامك» form: is there a legal duty to give the details,
 *   what they are used for, who gets them. `{months}` = retention period from site settings.
 * - MARKETING: the separate, unchecked opt-in for advertising messages (חוק התקשורת, סעיף 30א).
 */
export const LEAD_NOTICE: Record<SiteLocale, { text: string; link: string; marketing: string }> =
  {
    ar: {
      text:
        'المعلومات التي تكتبها هنا (الاسم، الهاتف، الدورة، الملاحظات) تُحفظ لدى الكلية وتُستعمل فقط للرد على طلبك والتواصل معك بخصوصه. لا يوجد واجب قانوني بتزويدها، لكن بدونها لن نستطيع الرد عليك. ' +
        'يراها طاقم الكلية المخوَّل فقط، ولا نعطيها لأي جهة أخرى، وتُحذف بعد {months} شهراً على الأكثر. بإرسال الاستمارة أنت توافق على ذلك.',
      link: 'التفاصيل وحقوقك في سياسة الخصوصية',
      marketing:
        'أوافق أيضاً أن تُرسل لي الكلية رسائل عن دورات ومنح جديدة (واتساب / رسائل نصية / بريد إلكتروني). اختياري، ويمكن التراجع في أي وقت.',
    },
    he: {
      text:
        'הפרטים שתמלאו כאן (שם, טלפון, קורס, הערות) נשמרים אצל המכללה ומשמשים רק למענה על פנייתכם וליצירת קשר בעניינה. אין חובה חוקית למסור אותם, אך בלעדיהם לא נוכל לחזור אליכם. ' +
        'רואה אותם רק צוות המכללה המורשה, איננו מעבירים אותם לאף גורם אחר, והם נמחקים לכל היותר אחרי {months} חודשים. בשליחת הטופס אתם מסכימים לכך.',
      link: 'פרטים והזכויות שלכם במדיניות הפרטיות',
      marketing:
        'אני מסכים/ה שהמכללה תשלח לי גם הודעות על קורסים ושוברים חדשים (וואטסאפ / SMS / דוא"ל). לא חובה, ואפשר לבטל בכל עת.',
    },
  }

/** Default retention of «سجّل اهتمامك» requests (months) when nothing is set in site settings. */
export const DEFAULT_LEADS_RETENTION_MONTHS = 24

export const leadRetentionMonths = (value: number | null | undefined) =>
  value && value >= 1 && value <= 84 ? Math.round(value) : DEFAULT_LEADS_RETENTION_MONTHS
