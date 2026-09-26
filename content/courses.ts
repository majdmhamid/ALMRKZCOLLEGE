import type { L10n } from "./types";

export type GroupSlug = "welding" | "hvac" | "construction-safety";

export type Group = { slug: GroupSlug; name: L10n; short: L10n; tagline: L10n; icon: string; image: string; count: number };

export const groups: Group[] = [
  { slug: "welding", name: { ar: "الحديد واللحام", he: "ריתוך ומתכת" }, short: { ar: "اللحام", he: "ריתוך" }, tagline: { ar: "مهنة مطلوبة في كل مصنع وورشة وموقع بناء", he: "מקצוע מבוקש בכל מפעל, מסגרייה ואתר בנייה" }, icon: "/assets/icons/welding.png", image: "/assets/groups/welding.webp", count: 3 },
  { slug: "hvac", name: { ar: "التكييف والتبريد", he: "קירור ומיזוג אוויר" }, short: { ar: "التكييف", he: "מיזוג אוויר" }, tagline: { ar: "من التركيب حتى تصليح الأعطال — بشهادة معتمدة", he: "מהתקנה ועד תיקון תקלות – עם תעודה מוכרת" }, icon: "/assets/icons/hvac.png", image: "/assets/groups/hvac.webp", count: 2 },
  { slug: "construction-safety", name: { ar: "البناء والسلامة", he: "בניין ובטיחות" }, short: { ar: "البناء والسلامة", he: "בניין ובטיחות" }, tagline: { ar: "الشهادات التي يطلبها القانون في كل موقع بناء", he: "ההסמכות שהחוק דורש בכל אתר בנייה" }, icon: "/assets/icons/construction.png", image: "/assets/groups/construction-safety.webp", count: 6 },
];

export type Course = { slug: string; group: GroupSlug; featured?: boolean; name: L10n; summary: L10n; hours: number; sessions: number; image: string };

export const courses: Course[] = [
  { slug: "welding-electrode-co2", group: "welding", featured: true, name: { ar: "دورة لحام إلكترود و-CO2", he: "קורס ריתוך אלקטרודה ו-CO2" }, summary: { ar: "الدورة الأساسية لدخول مهنة اللحام: 100 ساعة، نصفها تدريب عملي في الورشة.", he: "קורס הבסיס לכניסה למקצוע הריתוך: 100 שעות, מחציתן תרגול מעשי בסדנה." }, hours: 100, sessions: 25, image: "/assets/courses/welding-electrode-co2.webp" },
  { slug: "welding-argon", group: "welding", name: { ar: "دورة لحام أرغون (TIG)", he: "קורס ריתוך ארגון (TIG)" }, summary: { ar: "لحام دقيق للستانلس والألمنيوم والفولاذ — للحّامين الذين يريدون التخصص.", he: "ריתוך מדויק של נירוסטה, אלומיניום ופלדה – לרתכים שרוצים להתמקצע." }, hours: 50, sessions: 20, image: "/assets/courses/welding-argon.webp" },
  { slug: "hvac-technician-level-1", group: "hvac", featured: true, name: { ar: "دورة تقني تكييف وتبريد – المستوى الأول", he: "קורס טכנאי קירור ומיזוג אוויר – דרג 1" }, summary: { ar: "التأهيل الكامل لمهنة تقني تكييف: 288 ساعة نظري وعملي، بشهادة بإشراف وزارة العمل.", he: "ההכשרה המלאה למקצוע טכנאי מיזוג: 288 שעות עיוני ומעשי, עם תעודה בפיקוח משרד העבודה." }, hours: 288, sessions: 50, image: "/assets/courses/hvac-technician-level-1.webp" },
  { slug: "site-manager", group: "construction-safety", featured: true, name: { ar: "دورة مدير عمل في البناء", he: "קורס מנהל עבודה בבניין" }, summary: { ar: "الدورة الأشمل في الكلية (670 ساعة): تأهيل لوظيفة مدير عمل — وظيفة إلزامية في كل موقع بناء.", he: "הקורס המקיף ביותר במכללה (670 שעות): הכשרה לתפקיד מנהל עבודה – תפקיד חובה בכל אתר בנייה." }, hours: 670, sessions: 160, image: "/assets/courses/site-manager.webp" },
  { slug: "safety-assistant", group: "construction-safety", featured: true, name: { ar: "دورة مساعد أمان في البناء", he: "קורס עוזר בטיחות" }, summary: { ar: "وظيفة إلزامية بحسب القانون في كل موقع بناء يزيد ارتفاعه عن 7 أمتار ومساحته عن 1000 م².", he: "תפקיד חובה על פי חוק בכל אתר בנייה שגובהו מעל 7 מטר ושטחו מעל 1,000 מ״ר." }, hours: 45, sessions: 10, image: "/assets/courses/safety-assistant.webp" },
  { slug: "scaffolding-builder", group: "construction-safety", name: { ar: "دورة بنّاء سقالات محترف", he: "קורס בונה מקצועי לפיגומים" }, summary: { ar: "الشهادة التي يطلبها القانون للإشراف على تركيب وفك السقالات فوق 6 أمتار.", he: "ההסמכה שהחוק דורש לפיקוח על הקמה ופירוק של פיגומים בגובה מעל 6 מטרים." }, hours: 60, sessions: 13, image: "/assets/courses/scaffolding-builder.webp" },
  { slug: "self-loading-crane", group: "construction-safety", name: { ar: "دورة مشغّل رافعة تحميل ذاتي", he: "קורס עגורן להעמסה עצמית" }, summary: { ar: "96 ساعة نظري وعملي لاعتماد مشغّلي الرافعات وفق برنامج وزارة العمل.", he: "96 שעות עיוני ומעשי להסמכת עגורנאים להעמסה עצמית, לפי תוכנית משרד העבודה." }, hours: 96, sessions: 30, image: "/assets/courses/self-loading-crane.webp" },
  { slug: "work-at-height", group: "construction-safety", name: { ar: "تدريب العمل على ارتفاع", he: "הדרכת עבודה בגובה" }, summary: { ar: "يوم تدريب واحد إلزامي بحسب القانون لكل من يعمل على ارتفاع. التصريح ساري لسنتين.", he: "יום הדרכה אחד, חובה על פי חוק לכל מי שעובד בגובה. האישור תקף לשנתיים." }, hours: 8, sessions: 1, image: "/assets/courses/work-at-height.webp" },
];

/** Names of courses that are referenced (e.g. by graduates) but not listed on the site yet. */
export const courseNames: Record<string, L10n> = {
  "welding-pipes": { ar: "دورة لحام أنابيب وخزانات ضغط", he: "קורס ריתוך צנרת ומיכלי לחץ" },
  "hvac-technician-level-2": { ar: "دورة تقني تكييف وتبريد – المستوى الثاني", he: "קורס טכנאי קירור ומיזוג אוויר – דרג 2" },
  ...Object.fromEntries(courses.map((c) => [c.slug, c.name])),
};

/**
 * Next intake per course: an ISO date, or "weekly" for courses that run every week.
 * Sample dates — in Phase 2 these move to the admin panel (editable / hideable per course).
 */
export const startDates: Record<string, string> = {
  "welding-electrode-co2": "2026-10-04",
  "welding-argon": "2026-11-08",
  "hvac-technician-level-1": "2026-10-11",
  "site-manager": "2026-10-18",
  "safety-assistant": "2026-09-27",
  "scaffolding-builder": "2026-10-25",
  "self-loading-crane": "2026-11-01",
  "work-at-height": "weekly",
};

/** Admin switch: hide every intake date on the site at once. */
export const showStartDates = true;

/** Class hours per course; anything not listed is the evening slot. */
export const dayCourses: Record<string, string> = { "work-at-height": "08:00–16:00" };
