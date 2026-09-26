import type { L10n } from "./types";

export const news: { slug: string; date: string; title: L10n; excerpt: L10n; image: string }[] = [
  { slug: "certificates-ceremony-2026", date: "2026-09-07", title: { ar: "توزيع الشهادات على فوج جديد من خريجي الكلية", he: "חלוקת תעודות למחזור חדש של בוגרי המכללה" }, excerpt: { ar: "مبروك لخريجينا الجدد! صور من حفل توزيع الشهادات في الكلية.", he: "מזל טוב לבוגרים החדשים שלנו! תמונות מטקס חלוקת התעודות במכללה." }, image: "/assets/news/certificates.webp" },
  { slug: "work-at-height-training-2025", date: "2025-02-23", title: { ar: "تدريب عملي على العمل على ارتفاع", he: "הדרכה מעשית לעבודה בגובה" }, excerpt: { ar: "صور من التدريب العملي: استخدام معدات الحماية الشخصية والعمل الآمن على السلالم والسقالات.", he: "תמונות מהתרגול המעשי: שימוש בציוד מגן אישי ועבודה בטוחה על סולמות ופיגומים." }, image: "/assets/news/height.webp" },
  { slug: "safety-assistant-field-tour-akko", date: "2024-10-28", title: { ar: "جولة تعليم ميداني لدورة مساعد أمان في مدينة عكا", he: "סיור לימודי בשטח לקורס עוזר בטיחות בעכו" }, excerpt: { ar: "طلاب دورة مساعد أمان في البناء في جولة ميدانية بموقع بناء في عكا، بإشراف المركّز عمار حطيني.", he: "תלמידי קורס עוזר בטיחות בסיור שטח באתר בנייה בעכו, בהנחיית הרכז עמאר חטיני." }, image: "/assets/news/akko.webp" },
];

export const gallery = ["w1", "w2", "w3", "h1", "h2", "c1", "c2", "c3", "e1", "e2"].map((n) => `/assets/gallery/${n}.webp`);

export const hero = { poster: "/assets/hero/poster.webp", video: "/assets/hero.mp4" };

/** Main promo video (16:9, 60s). */
export const promo = { poster: "/assets/videos/c3PP4-TM3Y0.webp", src: "/assets/college-clip.mp4", dur: "1:00" };

/**
 * Course reels (9:16). The real stills/videos (welding/hvac/crane/construction) haven't arrived yet,
 * so course photos stand in — drop the real files at the same paths and they swap in as-is.
 */
export const reels = [
  { id: "welding", course: "welding-electrode-co2", dur: "0:20", poster: "/assets/courses/welding-electrode-co2.webp" },
  { id: "hvac", course: "hvac-technician-level-1", dur: "0:16", poster: "/assets/courses/hvac-technician-level-1.webp" },
  { id: "crane", course: "self-loading-crane", dur: "0:17", poster: "/assets/courses/self-loading-crane.webp" },
  { id: "construction", course: "site-manager", dur: "0:23", poster: "/assets/courses/site-manager.webp" },
] as const;

export type ReelId = (typeof reels)[number]["id"];
