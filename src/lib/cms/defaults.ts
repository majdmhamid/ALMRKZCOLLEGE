/**
 * المحتوى الأصلي من ملفات content/*.ts — نقطة البداية قبل أي تعديل من لوحة التحكم،
 * ومصدر "القيم الناقصة" (مثلاً نص واجهة جديد أُضيف في الكود ولم يُحفظ بعد في التخزين).
 */
import { courses } from "@content/courses";
import { groups } from "@content/groups";
import { dictionaries } from "@content/i18n";
import { gallery, galleryCategories, promoVideo, reels, videos } from "@content/media";
import { news } from "@content/news";
import { graduates, partners, staff } from "@content/people";
import { site } from "@content/site";
import type { Dictionary } from "@content/i18n";
import type { Locale } from "@content/types";
import type { SiteContent, SiteInfo } from "./schema";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function defaultContent(): SiteContent {
  const { url: _url, ...info } = site;
  void _url;
  return clone({
    schemaVersion: 1,
    site: info as unknown as SiteInfo,
    groups,
    courses,
    news,
    graduates,
    staff,
    partners,
    galleryCategories,
    gallery,
    videos,
    reels,
    promoVideo,
    texts: dictionaries as Record<Locale, Dictionary>,
  });
}

/**
 * يدمج المحتوى المحفوظ فوق الأصلي: القوائم تؤخذ كما هي من المحفوظ،
 * والكائنات (معلومات الكلية، نصوص الواجهة) تُكمَّل بأي مفتاح ناقص من الأصلي.
 */
export function withDefaults(stored: Partial<SiteContent> | null | undefined): SiteContent {
  const base = defaultContent();
  if (!stored) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(stored)) {
    if (v === undefined || v === null) continue;
    const b = (base as unknown as Record<string, unknown>)[k];
    out[k] = isPlainObject(b) && isPlainObject(v) ? deepFill(b, v) : v;
  }
  return out as unknown as SiteContent;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** المحفوظ يغلب، والناقص يُكمَّل من الأصلي (للكائنات فقط؛ القوائم تؤخذ كما هي) */
function deepFill(base: Record<string, unknown>, stored: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(stored)) {
    if (v === undefined || v === null) continue;
    const b = base[k];
    out[k] = isPlainObject(b) && isPlainObject(v) ? deepFill(b, v) : v;
  }
  return out;
}
