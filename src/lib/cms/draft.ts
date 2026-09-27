import "server-only";
import { withDefaults } from "./defaults";
import type { SiteContent } from "./schema";
import { cmsStore } from "./store";

/** المسودة الحالية — إذا ما في مسودة، تبدأ من المنشور (أو من المحتوى الأصلي) برقم نسخة 0 */
export async function loadDraft(): Promise<{ content: SiteContent; version: number; updatedAt: string | null }> {
  const store = await cmsStore();
  const draft = await store.getDraft();
  if (draft) return { content: withDefaults(draft.content), version: draft.version, updatedAt: draft.updatedAt };
  const published = await store.getPublished();
  return { content: withDefaults(published?.content), version: 0, updatedAt: null };
}

export async function loadPublished(): Promise<{ content: SiteContent; publishedAt: string | null }> {
  const published = await (await cmsStore()).getPublished();
  return { content: withDefaults(published?.content), publishedAt: published?.publishedAt ?? null };
}
