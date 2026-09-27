/**
 * مقارنة المسودة بالمنشور: شو انضاف، شو انحذف، شو تعدّل.
 * تُستعمل لعدّاد «تغييرات بانتظار النشر»، لشارات «جديد/معدّل» على البطاقات، ولملخّص النشر.
 */
import { LIST_KEYS, itemKey, type ListKey, type SiteContent } from "./schema";

export type ChangeKind = "added" | "removed" | "changed" | "reordered";

export interface Change {
  section: keyof SiteContent;
  kind: ChangeKind;
  key?: string;
  /** وصف مفهوم: «خريج جديد: عمار جبارين» */
  label: string;
}

export const SECTION_LABEL: Record<string, { one: string; many: string }> = {
  groups: { one: "مجال", many: "المجالات" },
  courses: { one: "دورة", many: "الدورات" },
  news: { one: "خبر", many: "الأخبار" },
  graduates: { one: "خريج", many: "الخريجون" },
  staff: { one: "عضو طاقم", many: "الطاقم" },
  partners: { one: "شريك", many: "الشركاء" },
  gallery: { one: "صورة", many: "معرض الصور" },
  videos: { one: "فيديو يوتيوب", many: "فيديوهات يوتيوب" },
  reels: { one: "فيديو قصير", many: "الفيديوهات القصيرة" },
  site: { one: "معلومات الكلية", many: "معلومات الكلية" },
  texts: { one: "نص", many: "نصوص الموقع" },
  galleryCategories: { one: "تصنيف صور", many: "تصنيفات الصور" },
  promoVideo: { one: "الفيديو التعريفي", many: "الفيديو التعريفي" },
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function itemLabel(section: ListKey, item: unknown): string {
  const it = item as Record<string, unknown>;
  const loc = (it.name ?? it.title ?? it.alt) as { ar?: string; he?: string } | undefined;
  const text = loc?.ar || loc?.he || "";
  if (section === "gallery") return text ? `صورة (${text.slice(0, 30)}…)` : "صورة";
  return text || String(itemKey(section, item));
}

function countLeafChanges(a: unknown, b: unknown): number {
  if (same(a, b)) return 0;
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let n = 0;
    for (const k of keys) n += countLeafChanges((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
    return n;
  }
  return 1;
}

export function diffContent(published: SiteContent, draft: SiteContent): Change[] {
  const out: Change[] = [];
  for (const section of LIST_KEYS) {
    const before = (published[section] ?? []) as unknown[];
    const after = (draft[section] ?? []) as unknown[];
    const bMap = new Map(before.map((x) => [itemKey(section, x), x]));
    const aMap = new Map(after.map((x) => [itemKey(section, x), x]));
    const name = SECTION_LABEL[section].one;
    for (const [k, v] of aMap) {
      if (!bMap.has(k)) out.push({ section, kind: "added", key: k, label: `${name} جديد: ${itemLabel(section, v)}` });
      else if (!same(bMap.get(k), v)) out.push({ section, kind: "changed", key: k, label: `تعديل ${name}: ${itemLabel(section, v)}` });
    }
    for (const [k, v] of bMap) if (!aMap.has(k)) out.push({ section, kind: "removed", key: k, label: `حذف ${name}: ${itemLabel(section, v)}` });
    const bOrder = before.map((x) => itemKey(section, x)).filter((k) => aMap.has(k));
    const aOrder = after.map((x) => itemKey(section, x)).filter((k) => bMap.has(k));
    if (!same(bOrder, aOrder)) out.push({ section, kind: "reordered", label: `ترتيب جديد: ${SECTION_LABEL[section].many}` });
  }
  if (!same(published.site, draft.site)) out.push({ section: "site", kind: "changed", label: "تعديل معلومات الكلية (هواتف، عنوان، روابط…)" });
  const textChanges = countLeafChanges(published.texts, draft.texts);
  if (textChanges) out.push({ section: "texts", kind: "changed", label: `تعديل نصوص الموقع (${textChanges} ${textChanges === 1 ? "نص" : "نصوص"})` });
  if (!same(published.galleryCategories, draft.galleryCategories)) out.push({ section: "galleryCategories", kind: "changed", label: "تعديل تصنيفات معرض الصور" });
  if (!same(published.promoVideo, draft.promoVideo)) out.push({ section: "promoVideo", kind: "changed", label: "تعديل الفيديو التعريفي" });
  return out;
}

/** حالة عنصر واحد مقارنة بالمنشور — لشارة على البطاقة */
export function itemStatus(published: SiteContent, section: ListKey, item: unknown): "new" | "changed" | null {
  const k = itemKey(section, item);
  const before = ((published[section] ?? []) as unknown[]).find((x) => itemKey(section, x) === k);
  if (!before) return "new";
  return same(before, item) ? null : "changed";
}
