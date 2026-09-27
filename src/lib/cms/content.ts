import "server-only";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { cache } from "react";
import { withDefaults } from "./defaults";
import type { SiteContent } from "./schema";
import { cmsStore } from "./store";

/** وسم التخزين المؤقت للمحتوى المنشور — زر «نشر» يلغيه فيتحدّث الموقع */
export const CONTENT_TAG = "site-content";

const loadPublished = unstable_cache(
  async () => {
    try {
      return (await (await cmsStore()).getPublished())?.content ?? null;
    } catch (e) {
      // إذا التخزين مش متاح، الموقع يضل شغّال بالمحتوى الأصلي
      console.error("[cms] could not read published content", e);
      return null;
    }
  },
  ["site-content-published"],
  { tags: [CONTENT_TAG] },
);

/** المحتوى المنشور (ما يراه الزائر). يصلح أيضاً خارج الطلبات (generateStaticParams، sitemap) */
export async function getPublishedContent(): Promise<SiteContent> {
  return withDefaults(await loadPublished());
}

/**
 * محتوى الصفحة الحالية: المنشور للزوار، والمسودة عندما يفتح المدير «معاينة الموقع» (Draft Mode).
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  let preview = false;
  try {
    preview = (await draftMode()).isEnabled;
  } catch {
    preview = false;
  }
  if (preview) {
    const store = await cmsStore();
    const draft = await store.getDraft().catch(() => null);
    if (draft) return withDefaults(draft.content);
  }
  return getPublishedContent();
});
