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
    /** Header button that stops every moving thing on the site (video, strips, auto-rotation). */
    pauseMotion: string
    resumeMotion: string
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
    pauseMotion: 'إيقاف الحركة والفيديو في الموقع',
    resumeMotion: 'تشغيل الحركة والفيديو في الموقع',
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
    pauseMotion: 'עצירת התנועה והווידאו באתר',
    resumeMotion: 'הפעלת התנועה והווידאו באתר',
  },
}

/**
 * «Stop motion» choice (header button, client.tsx): the key it is saved under on the device, and
 * the one-line script the header runs before the page paints so nothing moves first.
 */
export const MOTION_STORAGE_KEY = 'almrkz:motion'
export const MOTION_BOOT_SCRIPT = `try{if(localStorage.getItem('${MOTION_STORAGE_KEY}')==='1')document.documentElement.classList.add('motion-off')}catch(e){}`

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
