import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMockBackend } from "@/lib/backend-mode";
import type { DraftState, Release, SiteContent } from "./schema";

/**
 * مكان حفظ المحتوى:
 *  - Supabase (قاعدة بيانات + ملفات) على الموقع الحقيقي — نفس المشروع اللي بستعمله نظام التوقيع.
 *  - ملفات على الجهاز (مجلد .cms-data) للتجربة المحلية بدون أي إعداد.
 */
export interface CmsStore {
  kind: "file" | "supabase";
  getDraft(): Promise<DraftState | null>;
  /** يحفظ المسودة. إذا الرقم المتوقَّع ما بطابق (تعديل من مكان ثاني) يرمي VersionConflictError */
  saveDraft(content: SiteContent, expectedVersion: number): Promise<DraftState>;
  deleteDraft(): Promise<void>;
  getPublished(): Promise<{ content: SiteContent; publishedAt: string } | null>;
  publish(content: SiteContent, note: string, summary: string[]): Promise<Release>;
  listReleases(limit?: number): Promise<Release[]>;
  getRelease(id: string): Promise<SiteContent | null>;
  /** يرفع صورة ويرجّع رابطها العام */
  uploadMedia(bytes: Buffer, folder: string, ext: string, contentType: string): Promise<string>;
  /** رابط رفع مباشر من المتصفح (للفيديو — أكبر من حد الطلبات على الخادم) */
  videoUploadTarget(): Promise<{ kind: "signed"; signedUrl: string; publicUrl: string } | { kind: "local" }>;
}

export class VersionConflictError extends Error {
  constructor() {
    super("draft version conflict");
  }
}

const now = () => new Date().toISOString();
const newId = () => `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const safeFolder = (f: string) => f.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "misc";

/* ───────────────────────── ملفات محلية ───────────────────────── */

export function cmsDataDir() {
  return process.env.CMS_DATA_DIR || path.join(process.cwd(), ".cms-data");
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(tmp, JSON.stringify(data), "utf8");
  await rename(tmp, file);
}

class FileStore implements CmsStore {
  kind = "file" as const;
  private dir = cmsDataDir();
  private f = (name: string) => path.join(this.dir, name);

  getDraft() {
    return readJson<DraftState>(this.f("draft.json"));
  }

  async saveDraft(content: SiteContent, expectedVersion: number) {
    const cur = await this.getDraft();
    if ((cur?.version ?? 0) !== expectedVersion) throw new VersionConflictError();
    const next: DraftState = { content, version: expectedVersion + 1, updatedAt: now() };
    await writeJson(this.f("draft.json"), next);
    return next;
  }

  async deleteDraft() {
    await rm(this.f("draft.json"), { force: true });
  }

  getPublished() {
    return readJson<{ content: SiteContent; publishedAt: string }>(this.f("published.json"));
  }

  async publish(content: SiteContent, note: string, summary: string[]) {
    const release: Release = { id: newId(), createdAt: now(), note, summary };
    await writeJson(this.f(`releases/${release.id}.json`), { ...release, content });
    await writeJson(this.f("published.json"), { content, publishedAt: release.createdAt });
    return release;
  }

  async listReleases(limit = 30) {
    let names: string[] = [];
    try {
      names = await readdir(this.f("releases"));
    } catch {
      return [];
    }
    const all = await Promise.all(names.filter((n) => n.endsWith(".json")).map((n) => readJson<Release & { content?: unknown }>(this.f(`releases/${n}`))));
    return all
      .filter((r): r is Release & { content?: unknown } => !!r)
      .map(({ content: _c, ...r }) => (void _c, r))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async getRelease(id: string) {
    if (!/^[a-z0-9]+$/i.test(id)) return null;
    const r = await readJson<{ content: SiteContent }>(this.f(`releases/${id}.json`));
    return r?.content ?? null;
  }

  async uploadMedia(bytes: Buffer, folder: string, ext: string) {
    const name = `${newId()}.${ext}`;
    const rel = `${safeFolder(folder)}/${name}`;
    const file = this.f(`media/${rel}`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    return `/cms-media/${rel}`;
  }

  async videoUploadTarget() {
    return { kind: "local" as const };
  }
}

/* ───────────────────────── Supabase ───────────────────────── */

const BUCKET = "site-media";

class SupabaseStore implements CmsStore {
  kind = "supabase" as const;
  constructor(private db: SupabaseClient) {}

  async getDraft() {
    const { data, error } = await this.db.from("site_content").select("data, version, updated_at").eq("id", "draft").maybeSingle();
    if (error) throw error;
    return data ? { content: data.data as SiteContent, version: data.version as number, updatedAt: data.updated_at as string } : null;
  }

  async saveDraft(content: SiteContent, expectedVersion: number) {
    const updatedAt = now();
    const version = expectedVersion + 1;
    if (expectedVersion === 0) {
      const { error } = await this.db.from("site_content").insert({ id: "draft", data: content, version, updated_at: updatedAt });
      if (error) {
        if (error.code === "23505") throw new VersionConflictError();
        throw error;
      }
    } else {
      const { data, error } = await this.db
        .from("site_content")
        .update({ data: content, version, updated_at: updatedAt })
        .eq("id", "draft")
        .eq("version", expectedVersion)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new VersionConflictError();
    }
    return { content, version, updatedAt };
  }

  async deleteDraft() {
    const { error } = await this.db.from("site_content").delete().eq("id", "draft");
    if (error) throw error;
  }

  async getPublished() {
    const { data, error } = await this.db.from("site_content").select("data, updated_at").eq("id", "published").maybeSingle();
    if (error) throw error;
    return data ? { content: data.data as SiteContent, publishedAt: data.updated_at as string } : null;
  }

  async publish(content: SiteContent, note: string, summary: string[]) {
    const createdAt = now();
    const { data, error } = await this.db.from("site_releases").insert({ data: content, note, summary, created_at: createdAt }).select("id").single();
    if (error) throw error;
    const up = await this.db.from("site_content").upsert({ id: "published", data: content, version: 1, updated_at: createdAt });
    if (up.error) throw up.error;
    return { id: String(data.id), createdAt, note, summary };
  }

  async listReleases(limit = 30) {
    const { data, error } = await this.db.from("site_releases").select("id, note, summary, created_at").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: String(r.id), note: r.note ?? "", summary: (r.summary as string[]) ?? [], createdAt: r.created_at as string }));
  }

  async getRelease(id: string) {
    if (!/^\d+$/.test(id)) return null;
    const { data, error } = await this.db.from("site_releases").select("data").eq("id", Number(id)).maybeSingle();
    if (error) throw error;
    return (data?.data as SiteContent) ?? null;
  }

  async uploadMedia(bytes: Buffer, folder: string, ext: string, contentType: string) {
    const key = `${safeFolder(folder)}/${newId()}.${ext}`;
    const { error } = await this.db.storage.from(BUCKET).upload(key, bytes, { contentType, cacheControl: "31536000", upsert: false });
    if (error) throw error;
    return this.db.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  }

  async videoUploadTarget() {
    const key = `videos/${newId()}.mp4`;
    const { data, error } = await this.db.storage.from(BUCKET).createSignedUploadUrl(key);
    if (error) throw error;
    return { kind: "signed" as const, signedUrl: data.signedUrl, publicUrl: this.db.storage.from(BUCKET).getPublicUrl(key).data.publicUrl };
  }
}

/* ───────────────────────── الاختيار ───────────────────────── */

export const supabaseConfigured = () => !isMockBackend && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

let store: CmsStore | null = null;

export async function cmsStore(): Promise<CmsStore> {
  if (store) return store;
  if (supabaseConfigured()) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    store = new SupabaseStore(db);
  } else {
    store = new FileStore();
  }
  return store;
}
