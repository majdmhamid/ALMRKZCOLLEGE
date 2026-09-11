import type { Graduate, Partner, StaffMember } from "./types";

/** طاقم الكلية — بنفس ترتيب الموقع القديم */
export const staff: StaffMember[] = [
  {
    slug: "alaa-mahamid",
    name: { ar: "علاء محاميد", he: "עלאא מחאמיד" },
    role: { ar: "مدير الكلية · محاسب ومستشار ضرائب", he: "מנהל המכללה · רו״ח ויועץ מס" },
    image: "/images/staff/alaa-mahamid.webp",
  },
  {
    slug: "mohammad-fahmawi",
    name: { ar: "محمد فحماوي", he: "מוחמד פחמאוי" },
    role: { ar: "مركّز دورات اللحام", he: "רכז קורסי ריתוך" },
    image: "/images/staff/mohammad-fahmawi.webp",
  },
  {
    slug: "issam-najjar",
    name: { ar: "عصام نجار", he: "עיסאם נג׳אר" },
    role: { ar: "مركّز دورات التكييف والتبريد", he: "רכז קורסי קירור ומיזוג אוויר" },
    image: "/images/staff/issam-najjar.webp",
  },
  {
    slug: "ammar-hatini",
    name: { ar: "عمار حطيني", he: "עמאר חטיני" },
    role: { ar: "مركّز دورات البناء والسلامة", he: "רכז קורסי בניין ובטיחות" },
    image: "/images/staff/ammar-hatini.webp",
  },
  {
    slug: "adnan-abu-siam",
    name: { ar: "عدنان أبو صيام", he: "עדנאן אבו סיאם" },
    role: { ar: "مركّز دورات البناء والسلامة", he: "רכז קורסי בניין ובטיחות" },
    image: "/images/staff/adnan-abu-siam.webp",
  },
  {
    slug: "salsabil-abu-raad",
    name: { ar: "سلسبيل أبو رعد", he: "סלסביל אבו רעד" },
    role: { ar: "مديرة المكتب والتسجيل", he: "מנהלת משרד ורישום" },
    image: "/images/staff/salsabil-abu-raad.webp",
  },
];

/** خريجو الكلية — الأسماء والدورات كما في الموقع القديم */
export const graduates: Graduate[] = [
  { slug: "ammar-jabarin", name: { ar: "عمار جبارين", he: "עמאר ג׳בארין" }, course: "scaffolding-builder", image: "/images/graduates/ammar-jabarin.webp" },
  { slug: "najwan-igbariya", name: { ar: "نجوان إغبارية", he: "נג׳ואן אגבאריה" }, course: "self-loading-crane", image: "/images/graduates/najwan-igbariya.webp" },
  { slug: "mohammad-mahajna", name: { ar: "محمد محاجنة", he: "מוחמד מחאג׳נה" }, course: "welding-pipes", image: "/images/graduates/mohammad-mahajna.webp" },
  { slug: "majd-tarabiya", name: { ar: "مجد طربية", he: "מג׳ד טרביה" }, course: "safety-assistant", image: "/images/graduates/majd-tarabiya.webp" },
  { slug: "yousef-mahamid", name: { ar: "يوسف محاميد", he: "יוסף מחאמיד" }, course: "welding-pipes", image: "/images/graduates/yousef-mahamid.webp" },
  { slug: "mohammad-asla", name: { ar: "محمد عاصلة", he: "מוחמד עאסלה" }, course: "scaffolding-builder", image: "/images/graduates/mohammad-asla.webp" },
  { slug: "wadee-mahamid", name: { ar: "وديع محاميد", he: "ודיע מחאמיד" }, course: "hvac-technician-level-2", image: "/images/graduates/wadee-mahamid.webp" },
  { slug: "nael-mahajna", name: { ar: "نائل محاجنة", he: "נאיל מחאג׳נה" }, course: "welding-electrode-co2", image: "/images/graduates/nael-mahajna.webp" },
  { slug: "mufleh-amash", name: { ar: "مفلح عماش", he: "מופלח עמאש" }, course: "self-loading-crane", image: "/images/graduates/mufleh-amash.webp" },
  { slug: "mahmoud-igbariya", name: { ar: "محمود إغبارية", he: "מחמוד אגבאריה" }, course: "hvac-technician-level-1", image: "/images/graduates/mahmoud-igbariya.webp" },
  { slug: "mousa-fakhouri", name: { ar: "موسى فخوري", he: "מוסא פח׳ורי" }, course: "scaffolding-builder", image: "/images/graduates/mousa-fakhouri.webp" },
  { slug: "mehran-abu-abed", name: { ar: "مهران أبو عابد", he: "מהראן אבו עאבד" }, course: "welding-electrode-co2", image: "/images/graduates/mehran-abu-abed.webp" },
  { slug: "ihab-fadila", name: { ar: "إيهاب فضيلة", he: "איהאב פדילה" }, course: "scaffolding-builder", image: "/images/graduates/ihab-fadila.webp" },
  { slug: "alaa-katana", name: { ar: "علاء كتانة", he: "עלאא כתאנה" }, course: "safety-assistant", image: "/images/graduates/alaa-katana.webp" },
  { slug: "kamal-igbariya", name: { ar: "كمال إغبارية", he: "כמאל אגבאריה" }, course: "welding-argon", image: "/images/graduates/kamal-igbariya.webp" },
  { slug: "luqman-aql", name: { ar: "لقمان عقل", he: "לוקמאן עקל" }, course: "welding-argon", image: "/images/graduates/luqman-aql.webp" },
];

/**
 * الجهات الشريكة والمعتمِدة (كما في الموقع القديم).
 * الروابط غير معروفة — تُضاف عند توفرها من إدارة الكلية.
 */
export const partners: Partner[] = [
  { slug: "ministry-of-labor", name: { ar: "وزارة العمل", he: "משרד העבודה" }, image: "/images/partners/ministry-of-labor.png" },
  { slug: "ministry-of-transport", name: { ar: "وزارة المواصلات والأمان على الطرق", he: "משרד התחבורה והבטיחות בדרכים" }, image: "/images/partners/ministry-of-transport.png" },
  { slug: "john-deere", name: { ar: "John Deere", he: "John Deere" }, image: "/images/partners/john-deere.png" },
  { slug: "merkavim", name: { ar: "مركافيم", he: "מרכבים" }, image: "/images/partners/merkavim.png" },
  { slug: "beton-mawasi", name: { ar: "باطون مواسي", he: "בטון מואסי" }, image: "/images/partners/beton-mawasi.png" },
];
