/**
 * شكل كل محتوى الموقع كما تحفظه لوحة التحكم.
 *
 * نسختان في التخزين:
 *  - "draft"     المسودة: كل تعديل في لوحة التحكم يُحفظ هنا فوراً، والزائر لا يراه.
 *  - "published" المنشور: ما يراه الزائر. زر «نشر» ينسخ المسودة إلى هنا ويحفظ نسخة في السجل.
 *
 * إذا لم يكن هناك شيء محفوظ بعد، يُبنى المحتوى من ملفات content/*.ts (المحتوى الأصلي).
 */
import type { Dictionary } from "@content/i18n";
import type { Course, GalleryImage, Graduate, Group, LocalVideo, Localized, Locale, NewsPost, Partner, StaffMember, Video } from "@content/types";

export interface SiteInfo {
  name: Localized;
  shortName: Localized;
  city: Localized;
  foundedYear: number;
  phone: string;
  phoneIntl: string;
  mobile: string;
  whatsappUrl: string;
  email: string;
  address: Localized;
  mapQuery: string;
  social: { facebook: string; youtube: string; instagram: string };
  hours: Localized;
}

export interface GalleryCategoryDef {
  slug: string;
  label: Localized;
}

export interface SiteContent {
  schemaVersion: 1;
  site: SiteInfo;
  groups: Group[];
  courses: Course[];
  news: NewsPost[];
  graduates: Graduate[];
  staff: StaffMember[];
  partners: Partner[];
  galleryCategories: GalleryCategoryDef[];
  gallery: GalleryImage[];
  videos: Video[];
  reels: LocalVideo[];
  promoVideo: LocalVideo;
  texts: Record<Locale, Dictionary>;
}

/** الأقسام اللي فيها قوائم عناصر (كل عنصر إله مفتاح ثابت) */
export const LIST_KEYS = ["groups", "courses", "news", "graduates", "staff", "partners", "gallery", "videos", "reels"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

/** الأقسام المفردة (كائن واحد) */
export const SINGLE_KEYS = ["site", "texts", "galleryCategories", "promoVideo"] as const;
export type SingleKey = (typeof SINGLE_KEYS)[number];

export type SectionKey = ListKey | SingleKey;

/** المفتاح الثابت لكل عنصر في قائمة */
export function itemKey(section: ListKey, item: unknown): string {
  const it = item as Record<string, unknown>;
  if (section === "gallery") return String(it.src);
  if (section === "videos") return String(it.youtubeId);
  return String(it.slug);
}

/** سجل نسخة منشورة */
export interface Release {
  id: string;
  createdAt: string;
  note: string;
  /** ملخص قصير للتغييرات (للعرض في السجل) */
  summary: string[];
}

export interface DraftState {
  content: SiteContent;
  /** يزيد مع كل حفظ — يمنع تعديلين من مكانين يمسحوا بعض */
  version: number;
  updatedAt: string;
}
