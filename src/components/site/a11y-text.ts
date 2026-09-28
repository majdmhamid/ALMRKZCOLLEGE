import type { SiteLocale } from '@/lib/rules'

/**
 * Words read out by screen readers only (or shown only to keyboard users, like the skip link).
 * Kept in code, not in «نصوص الواجهة», so they are always there in both languages.
 */
export const A11Y: Record<
  SiteLocale,
  {
    skip: string
    mainNav: string
    quickNav: string
    crumbs: string
    prev: string
    next: string
    play: string
    pauseRotation: string
    resumeRotation: string
    courses: string
    contact: string
    newTab: string
  }
> = {
  ar: {
    skip: 'تخطَّ إلى المحتوى',
    mainNav: 'القائمة الرئيسية',
    quickNav: 'روابط سريعة',
    crumbs: 'مسار الصفحة',
    prev: 'السابق',
    next: 'التالي',
    play: 'تشغيل الفيديو',
    pauseRotation: 'إيقاف التبديل التلقائي',
    resumeRotation: 'تشغيل التبديل التلقائي',
    courses: 'الدورات',
    contact: 'تواصل سريع',
    newTab: 'يفتح في نافذة جديدة',
  },
  he: {
    skip: 'דלג לתוכן',
    mainNav: 'תפריט ראשי',
    quickNav: 'קישורים מהירים',
    crumbs: 'נתיב ניווט',
    prev: 'הקודם',
    next: 'הבא',
    play: 'הפעלת הסרטון',
    pauseRotation: 'עצירת ההחלפה האוטומטית',
    resumeRotation: 'הפעלת ההחלפה האוטומטית',
    courses: 'הקורסים',
    contact: 'יצירת קשר מהירה',
    newTab: 'נפתח בחלון חדש',
  },
}

/** Proper names of the social networks (the admin stores them lower-case). */
export const SOCIAL_NAMES: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  x: 'X',
  twitter: 'X',
  telegram: 'Telegram',
}
