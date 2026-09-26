/**
 * Starting content. Only facts already agreed in docs/PLAN.md are here.
 * Everything from the design's content.js will be added when it arrives.
 * Hebrew texts marked "TODO(owners)" need a check by Hussein/Majd.
 */
type L = { ar: string; he: string }

export const siteSettings = {
  siteName: { ar: 'كلية المركز للتأهيل المهني', he: 'מכללת המרכז להכשרה מקצועית' } satisfies L,
  shortName: { ar: 'كلية المركز', he: 'מכללת המרכז' } satisfies L,
  accreditation: {
    ar: 'بإشراف وزارة العمل منذ 2008',
    he: 'בפיקוח משרד העבודה מאז 2008',
  } satisfies L,
  address: { ar: 'أم الفحم', he: 'אום אל-פחם' } satisfies L,
  foundedYear: 2008,
  whatsappMessage: {
    ar: 'مرحباً، بدي أستفسر عن الدورات في كلية المركز',
    he: 'שלום, אשמח לקבל פרטים על הקורסים במכללת המרכז',
  } satisfies L,
  titleTemplate: {
    ar: '%s | كلية المركز للتأهيل المهني',
    he: '%s | מכללת המרכז להכשרה מקצועית',
  } satisfies L,
}

export const menu: { label: L; page: string }[] = [
  { label: { ar: 'الرئيسية', he: 'ראשי' }, page: 'home' },
  { label: { ar: 'الدورات', he: 'קורסים' }, page: 'courses' },
  { label: { ar: 'عن الكلية', he: 'אודות' }, page: 'about' },
  { label: { ar: 'معرض الصور والفيديو', he: 'גלריה' }, page: 'gallery' },
  { label: { ar: 'قصص نجاح', he: 'סיפורי הצלחה' }, page: 'success-stories' },
  { label: { ar: 'أخبار وإعلانات', he: 'חדשות ועדכונים' }, page: 'news' },
  { label: { ar: 'للشركات والمشغّلين', he: 'לחברות ולמעסיקים' }, page: 'companies' },
  { label: { ar: 'اتصل بنا', he: 'צור קשר' }, page: 'contact' },
]

export const ctaLabel: L = { ar: 'سجّل اهتمامك', he: 'השאירו פרטים' }

export const copyright: L = {
  ar: '© {year} كلية المركز للتأهيل المهني — أم الفحم. جميع الحقوق محفوظة.',
  he: '© {year} מכללת המרכז להכשרה מקצועית — אום אל-פחם. כל הזכויות שמורות.',
}

export const courseGroups: { slug: string; name: L; order: number }[] = [
  { slug: 'iron', name: { ar: 'الحديد', he: 'ברזל' }, order: 1 },
  { slug: 'safety', name: { ar: 'السلامة', he: 'בטיחות' }, order: 2 },
  { slug: 'air-conditioning', name: { ar: 'التكييف', he: 'מיזוג אוויר' }, order: 3 },
]

// Saved as DRAFTS: details (duration, certificate, requirements…) are still missing
// (docs/OPEN-ITEMS.md §3), so they stay hidden from the site until completed and published.
export const courses: { slug: string; group: string; name: L; order: number }[] = [
  {
    slug: 'welding-1',
    group: 'iron',
    name: { ar: 'لحام — مستوى 1', he: "ריתוך — שלב א'" },
    order: 1,
  },
  {
    slug: 'welding-2',
    group: 'iron',
    name: { ar: 'لحام — مستوى 2', he: "ריתוך — שלב ב'" },
    order: 2,
  },
  {
    slug: 'construction-ironwork',
    group: 'iron',
    name: { ar: 'حدادة بناء', he: 'ברזלנות בניין' },
    order: 3,
  },
  {
    slug: 'safety-assistant',
    group: 'safety',
    name: { ar: 'مساعد سلامة', he: 'עוזר בטיחות' },
    order: 1,
  },
  { slug: 'work-manager', group: 'safety', name: { ar: 'مدير عمل', he: 'מנהל עבודה' }, order: 2 },
  {
    slug: 'ac-technician-1',
    group: 'air-conditioning',
    name: { ar: 'فني تكييف وتبريد — مستوى 1', he: "טכנאי מיזוג אוויר וקירור — שלב א'" },
    order: 1,
  },
  {
    slug: 'ac-technician-2',
    group: 'air-conditioning',
    name: { ar: 'فني تكييف وتبريد — مستوى 2', he: "טכנאי מיזוג אוויר וקירור — שלב ב'" },
    order: 2,
  },
]
