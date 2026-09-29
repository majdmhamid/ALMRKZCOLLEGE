import type { SiteLocale } from '@/lib/rules'

/**
 * Fixed words of the About / Contact / News pages and the «دورات تفتح قريباً» list.
 * Kept in code (like a11y-text.ts) so they are always there in both languages; page titles
 * come from «نصوص الواجهة» → كلمات القائمة when they are filled in.
 */
export const PAGE_TEXT: Record<
  SiteLocale,
  {
    about: string
    contact: string
    news: string
    allNews: string
    noNews: string
    address: string
    phones: string
    whatsapp: string
    email: string
    hours: string
    openMap: string
    showMap: string
    mapTitle: string
    writeUs: string
    founded: string
    years: string
    courses: string
    groups: string
    upcomingKicker: string
    upcomingTitle: string
    upcomingNote: string
    print: string
    printFooter: string
  }
> = {
  ar: {
    about: 'عن الكلية',
    contact: 'اتصل بنا',
    news: 'أخبار وإعلانات',
    allNews: 'كل الأخبار',
    noNews: 'ما في أخبار منشورة حالياً.',
    address: 'العنوان',
    phones: 'الهاتف',
    whatsapp: 'واتساب',
    email: 'البريد الإلكتروني',
    hours: 'ساعات الدوام',
    openMap: 'افتح بالخريطة',
    showMap: 'اعرض الخريطة',
    mapTitle: 'موقع الكلية على الخريطة',
    writeUs: 'اترك رقمك ومنرجعلك',
    founded: 'تأسست الكلية سنة',
    years: 'سنة خبرة',
    courses: 'دورة مهنية',
    groups: 'مجالات تأهيل',
    upcomingKicker: 'مواعيد',
    upcomingTitle: 'دورات تفتح قريباً',
    upcomingNote: 'المواعيد تقريبية وممكن تتغيّر — تواصل معنا للتأكيد.',
    print: 'اطبع / احفظ PDF',
    printFooter: 'للتسجيل والاستفسار',
  },
  he: {
    about: 'על המכללה',
    contact: 'צור קשר',
    news: 'חדשות ועדכונים',
    allNews: 'כל החדשות',
    noNews: 'אין כרגע חדשות.',
    address: 'כתובת',
    phones: 'טלפון',
    whatsapp: 'וואטסאפ',
    email: 'דוא"ל',
    hours: 'שעות פעילות',
    openMap: 'פתיחה במפה',
    showMap: 'הצגת המפה',
    mapTitle: 'מיקום המכללה במפה',
    writeUs: 'השאירו מספר ונחזור אליכם',
    founded: 'המכללה נוסדה בשנת',
    years: 'שנות ניסיון',
    courses: 'קורסים מקצועיים',
    groups: 'תחומי הכשרה',
    upcomingKicker: 'מועדים',
    upcomingTitle: 'קורסים שנפתחים בקרוב',
    upcomingNote: 'המועדים משוערים ועשויים להשתנות — צרו קשר לאישור.',
    print: 'הדפסה / שמירה כ-PDF',
    printFooter: 'להרשמה ולבירורים',
  },
}
