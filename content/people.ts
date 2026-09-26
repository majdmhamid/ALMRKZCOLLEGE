import type { L10n } from "./types";

export const graduates: { slug: string; name: L10n; course: string; image: string }[] = [
  { slug: "ammar-jabarin", name: { ar: "عمار جبارين", he: "עמאר ג׳בארין" }, course: "scaffolding-builder", image: "/assets/graduates/ammar-jabarin.webp" },
  { slug: "najwan-igbariya", name: { ar: "نجوان إغبارية", he: "נג׳ואן אגבאריה" }, course: "self-loading-crane", image: "/assets/graduates/najwan-igbariya.webp" },
  { slug: "mohammad-mahajna", name: { ar: "محمد محاجنة", he: "מוחמד מחאג׳נה" }, course: "welding-pipes", image: "/assets/graduates/mohammad-mahajna.webp" },
  { slug: "majd-tarabiya", name: { ar: "مجد طربية", he: "מג׳ד טרביה" }, course: "safety-assistant", image: "/assets/graduates/majd-tarabiya.webp" },
  { slug: "yousef-mahamid", name: { ar: "يوسف محاميد", he: "יוסף מחאמיד" }, course: "welding-pipes", image: "/assets/graduates/yousef-mahamid.webp" },
  { slug: "mohammad-asla", name: { ar: "محمد عاصلة", he: "מוחמד עאסלה" }, course: "scaffolding-builder", image: "/assets/graduates/mohammad-asla.webp" },
  { slug: "wadee-mahamid", name: { ar: "وديع محاميد", he: "ודיע מחאמיד" }, course: "hvac-technician-level-2", image: "/assets/graduates/wadee-mahamid.webp" },
  { slug: "nael-mahajna", name: { ar: "نائل محاجنة", he: "נאיל מחאג׳נה" }, course: "welding-electrode-co2", image: "/assets/graduates/nael-mahajna.webp" },
];

export const staff: { slug: string; name: L10n; role: L10n; image: string }[] = [
  { slug: "alaa-mahamid", name: { ar: "علاء محاميد", he: "עלאא מחאמיד" }, role: { ar: "مدير الكلية · محاسب ومستشار ضرائب", he: "מנהל המכללה · רו״ח ויועץ מס" }, image: "/assets/staff/alaa-mahamid.webp" },
  { slug: "mohammad-fahmawi", name: { ar: "محمد فحماوي", he: "מוחמד פחמאוי" }, role: { ar: "مركّز دورات اللحام", he: "רכז קורסי ריתוך" }, image: "/assets/staff/mohammad-fahmawi.webp" },
  { slug: "issam-najjar", name: { ar: "عصام نجار", he: "עיסאם נג׳אר" }, role: { ar: "مركّز دورات التكييف والتبريد", he: "רכז קורסי קירור ומיזוג אוויר" }, image: "/assets/staff/issam-najjar.webp" },
  { slug: "ammar-hatini", name: { ar: "عمار حطيني", he: "עמאר חטיני" }, role: { ar: "مركّز دورات البناء والسلامة", he: "רכז קורסי בניין ובטיחות" }, image: "/assets/staff/ammar-hatini.webp" },
  { slug: "adnan-abu-siam", name: { ar: "عدنان أبو صيام", he: "עדנאן אבו סיאם" }, role: { ar: "مركّز دورات البناء والسلامة", he: "רכז קורסי בניין ובטיחות" }, image: "/assets/staff/adnan-abu-siam.webp" },
  { slug: "salsabil-abu-raad", name: { ar: "سلسبيل أبو رعد", he: "סלסביל אבו רעד" }, role: { ar: "مديرة المكتب والتسجيل", he: "מנהלת משרד ורישום" }, image: "/assets/staff/salsabil-abu-raad.webp" },
];

export const partners: { slug: string; name: L10n; image: string }[] = [
  { slug: "ministry-of-labor", name: { ar: "وزارة العمل", he: "משרד העבודה" }, image: "/assets/partners/ministry-of-labor.png" },
  { slug: "ministry-of-transport", name: { ar: "وزارة المواصلات والأمان على الطرق", he: "משרד התחבורה והבטיחות בדרכים" }, image: "/assets/partners/ministry-of-transport.png" },
  { slug: "john-deere", name: { ar: "John Deere", he: "John Deere" }, image: "/assets/partners/john-deere.png" },
  { slug: "merkavim", name: { ar: "مركافيم", he: "מרכבים" }, image: "/assets/partners/merkavim.png" },
  { slug: "beton-mawasi", name: { ar: "باطون مواسي", he: "בטון מואסי" }, image: "/assets/partners/beton-mawasi.png" },
];
