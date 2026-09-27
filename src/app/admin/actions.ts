"use server";

import { revalidatePath, updateTag } from "next/cache";
import sharp from "sharp";
import { assertAdmin } from "@/lib/cms/auth";
import { CONTENT_TAG } from "@/lib/cms/content";
import { withDefaults } from "@/lib/cms/defaults";
import { diffContent } from "@/lib/cms/diff";
import { loadDraft, loadPublished } from "@/lib/cms/draft";
import { checkContent, checkMissing } from "@/lib/cms/rules";
import { LIST_KEYS, SINGLE_KEYS, type SectionKey, type SiteContent } from "@/lib/cms/schema";
import { cmsStore, VersionConflictError } from "@/lib/cms/store";

export type SaveResult = { ok: true; version: number; updatedAt: string } | { ok: false; reason: "conflict" | "error"; message?: string };

const SECTIONS = new Set<string>([...LIST_KEYS, ...SINGLE_KEYS]);

/** يحفظ قسماً واحداً من المسودة (الخريجون، الدورات، ...) — الزائر لا يرى شيئاً قبل «نشر» */
export async function saveSection(section: SectionKey, value: unknown, expectedVersion: number): Promise<SaveResult> {
  await assertAdmin();
  if (!SECTIONS.has(section)) return { ok: false, reason: "error", message: "unknown section" };
  if (LIST_KEYS.includes(section as never) && !Array.isArray(value)) return { ok: false, reason: "error", message: "expected a list" };
  try {
    const store = await cmsStore();
    const current = await loadDraft();
    if (current.version !== expectedVersion) return { ok: false, reason: "conflict" };
    const content = { ...current.content, [section]: value } as SiteContent;
    const saved = await store.saveDraft(content, expectedVersion);
    return { ok: true, version: saved.version, updatedAt: saved.updatedAt };
  } catch (e) {
    if (e instanceof VersionConflictError) return { ok: false, reason: "conflict" };
    console.error("[cms] save failed", e);
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** ينشر المسودة: الموقع يتحدّث فوراً، وتنحفظ نسخة في السجل للرجوع إليها */
export async function publishDraft(note: string): Promise<{ ok: true; version: number } | { ok: false; message: string; issues?: ReturnType<typeof checkContent> }> {
  await assertAdmin();
  const draft = await loadDraft();
  const issues = checkContent(draft.content);
  if (issues.length) return { ok: false, message: "rules", issues };
  if (checkMissing(draft.content).length) return { ok: false, message: "missing" };
  const published = await loadPublished();
  const summary = diffContent(published.content, draft.content).map((c) => c.label);
  if (!summary.length && published.publishedAt) return { ok: false, message: "nothing" };
  const store = await cmsStore();
  await store.publish(draft.content, note.slice(0, 200), summary.slice(0, 200));
  refreshSite();
  return { ok: true, version: draft.version };
}

/** يلغي كل التعديلات غير المنشورة (المسودة ترجع مثل الموقع الحالي) */
export async function discardDraft() {
  await assertAdmin();
  const store = await cmsStore();
  await store.deleteDraft();
  revalidatePath("/admin", "layout");
}

/** يرجّع الموقع لنسخة قديمة من السجل (تُنشر فوراً، والمسودة تصير مثلها) */
export async function restoreRelease(id: string) {
  await assertAdmin();
  const store = await cmsStore();
  const content = await store.getRelease(id);
  if (!content) return { ok: false as const };
  const full = withDefaults(content);
  const published = await loadPublished();
  const summary = diffContent(published.content, full).map((c) => c.label);
  const releases = await store.listReleases(100);
  const when = releases.find((r) => r.id === id)?.createdAt;
  await store.publish(full, `إرجاع لنسخة ${when ? new Date(when).toLocaleString("ar-EG-u-nu-latn") : id}`, summary);
  await store.deleteDraft();
  refreshSite();
  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function listReleases() {
  await assertAdmin();
  return (await cmsStore()).listReleases(50);
}

function refreshSite() {
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

/* ───────────── الصور ───────────── */

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"]);

/**
 * يرفع صورة: تُصغَّر (أقصى عرض حسب النوع) وتتحوّل WebP قبل الحفظ، فتبقى الصفحات سريعة.
 * الشعارات (logo) تبقى PNG لتحافظ على الشفافية.
 */
export async function uploadImage(form: FormData): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  await assertAdmin();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "misc");
  const kind = String(form.get("kind") ?? "photo");
  if (!(file instanceof File)) return { ok: false, message: "no file" };
  if (file.size > 15 * 1024 * 1024) return { ok: false, message: "too-big" };
  if (file.type && !IMAGE_TYPES.has(file.type)) return { ok: false, message: "type" };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const max = kind === "logo" ? 400 : kind === "portrait" ? 900 : 1800;
    const img = sharp(input, { failOn: "none" }).rotate().resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });
    const [bytes, ext, type] = kind === "logo" ? [await img.png({ compressionLevel: 9 }).toBuffer(), "png", "image/png"] : [await img.webp({ quality: 80 }).toBuffer(), "webp", "image/webp"];
    const url = await (await cmsStore()).uploadMedia(bytes, folder, ext, type);
    return { ok: true, url };
  } catch (e) {
    console.error("[cms] upload failed", e);
    return { ok: false, message: "failed" };
  }
}

/** وين يرفع المتصفح ملف الفيديو (رابط مباشر لـ Supabase، أو مسار محلي بوضع التجربة) */
export async function videoUploadTarget() {
  await assertAdmin();
  return (await cmsStore()).videoUploadTarget();
}
