/**
 * أنواع البيانات الأساسية للموقع.
 *
 * كل نص يظهر للزائر مكتوب باللغتين: { ar, he }.
 * هذا الشكل مقصود: لاحقاً عند ربط Payload CMS تصير هذه الحقول "localized fields"
 * وتنتقل البيانات من هذه الملفات إلى لوحة التحكم بدون تغيير الصفحات.
 */
export type Locale = "ar" | "he";
export const LOCALES: Locale[] = ["ar", "he"];
export const DEFAULT_LOCALE: Locale = "ar";

export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export type GroupSlug = "welding" | "hvac" | "construction-safety";

export interface Group {
  slug: GroupSlug;
  order: number;
  name: Localized;
  /** اسم قصير للقوائم والبطاقات */
  shortName: Localized;
  tagline: Localized;
  description: Localized;
  icon: string;
  image: string;
}

export interface Course {
  slug: string;
  group: GroupSlug;
  /** رقم الصفحة في الموقع القديم (للمرجع فقط) */
  legacyId: number;
  order: number;
  name: Localized;
  /** سطرين للبطاقة */
  summary: Localized;
  /** عنوان جذّاب لأعلى الصفحة */
  headline: Localized;
  hours: number;
  sessions: number;
  schedule: Localized;
  audience: Localized;
  /** فقرات وصف الدورة (اختياري) */
  description?: LocalizedList;
  topics: LocalizedList;
  requirements: LocalizedList;
  certificate: Localized;
  /** هل الدورة ملائمة لمنحة (شوفار)؟ الصياغة ثابتة ولا تُغيَّر */
  scholarship: boolean;
  /** ملاحظات إضافية (اختياري) */
  notes?: Localized;
  image: string;
  featured?: boolean;
}

export interface StaffMember {
  slug: string;
  name: Localized;
  role: Localized;
  image: string;
}

export interface Graduate {
  slug: string;
  name: Localized;
  course: string;
  image: string;
}

export interface Partner {
  slug: string;
  name: Localized;
  image: string;
  url?: string;
}

export type GalleryCategory = "welding" | "hvac" | "construction" | "events";

export interface GalleryImage {
  src: string;
  category: GalleryCategory;
  alt: Localized;
}

export interface Video {
  youtubeId: string;
  title: Localized;
  thumbnail: string;
}

/** فيديو محلي (mp4 مضغوط في public/videos) يُعرض بصورته أولاً ولا يُحمَّل إلا عند الضغط */
export interface LocalVideo {
  slug: string;
  /** مسار ملف mp4 داخل public/ */
  src: string;
  /** أول لقطة (webp) تظهر قبل التشغيل — وهي "الصورة" التي تُبدَّل بالفيديو لاحقاً */
  poster: string;
  title: Localized;
  /** المدة بالثواني (للعرض فقط) */
  seconds: number;
  /** عمودي (ريلز 9:16) أو عريض (16:9) */
  orientation: "portrait" | "landscape";
  /** المجموعة أو الدورة التي يخصّها الفيديو (لعرضه في صفحتها) */
  group?: string;
  course?: string;
}

export interface NewsPost {
  slug: string;
  /** تاريخ بصيغة YYYY-MM-DD */
  date: string;
  title: Localized;
  excerpt: Localized;
  body: LocalizedList;
  images: string[];
  relatedCourse?: string;
}
