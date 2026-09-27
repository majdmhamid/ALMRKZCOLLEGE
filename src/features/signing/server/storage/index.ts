import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { appUrl, isMockBackend, mockDataDir, serverEnv } from "@/features/signing/lib/env";
import { supabaseService } from "@/features/signing/lib/supabase/server";

export type Bucket = "originals" | "finals" | "signatures";

export interface FileStore {
  /** URL the admin's browser PUTs the file to directly (valid ~2h). */
  createUploadUrl(bucket: Bucket, objectPath: string): Promise<string>;
  upload(bucket: Bucket, objectPath: string, bytes: Uint8Array, contentType: string): Promise<void>;
  download(bucket: Bucket, objectPath: string): Promise<Uint8Array>;
  /** Short-lived read URL. `downloadName` makes the browser save instead of display. */
  signedUrl(bucket: Bucket, objectPath: string, ttlSeconds: number, downloadName?: string): Promise<string>;
  remove(bucket: Bucket, objectPaths: string[]): Promise<void>;
}

export const paths = {
  original: (documentId: string) => `${documentId}/original.pdf`,
  final: (documentId: string, stamp: number) => `${documentId}/final-${stamp}.pdf`,
  /** Unique per submission, so a rejected retry can never overwrite an accepted signature. */
  signature: (documentId: string, signerId: string, stamp: number) => `${documentId}/${signerId}-${stamp}.png`,
  adminSignature: (userId: string, stamp: number) => `admins/${userId}-${stamp}.png`,
};

let store: FileStore | null = null;

export function fileStore(): FileStore {
  store ??= isMockBackend ? localStore() : supabaseStore();
  return store;
}

// ---------------------------------------------------------------------------
// Supabase Storage (private buckets, service-role key)
// ---------------------------------------------------------------------------
function supabaseStore(): FileStore {
  const bucket = (b: Bucket) => supabaseService().storage.from(b);
  return {
    async createUploadUrl(b, p) {
      const { data, error } = await bucket(b).createSignedUploadUrl(p, { upsert: true });
      if (error || !data) throw new Error(`upload url failed: ${error?.message}`);
      return data.signedUrl;
    },
    async upload(b, p, bytes, contentType) {
      const { error } = await bucket(b).upload(p, bytes, { contentType, upsert: true });
      if (error) throw new Error(`upload failed: ${error.message}`);
    },
    async download(b, p) {
      const { data, error } = await bucket(b).download(p);
      if (error || !data) throw new Error(`download failed: ${error?.message}`);
      return new Uint8Array(await data.arrayBuffer());
    },
    async signedUrl(b, p, ttl, downloadName) {
      const { data, error } = await bucket(b).createSignedUrl(p, ttl, downloadName ? { download: downloadName } : undefined);
      if (error || !data) throw new Error(`signed url failed: ${error?.message}`);
      return data.signedUrl;
    },
    async remove(b, ps) {
      if (!ps.length) return;
      const { error } = await bucket(b).remove(ps);
      if (error) throw new Error(`remove failed: ${error.message}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Mock: files under .mock-data/storage, served by /api/mock-storage with an
// HMAC-signed, expiring query string (same shape of guarantees as Supabase).
// ---------------------------------------------------------------------------
export function mockFilePath(bucket: string, objectPath: string): string {
  const root = path.resolve(mockDataDir(), "storage");
  const full = path.resolve(root, bucket, objectPath);
  if (!full.startsWith(root + path.sep)) throw new Error("bad path");
  return full;
}

function mockSign(parts: string[]): string {
  return createHmac("sha256", serverEnv().SESSION_SECRET).update(parts.join("\n")).digest("base64url");
}

export function verifyMockSignature(params: URLSearchParams): boolean {
  const [b, p, e, op, d, s] = ["b", "p", "e", "op", "d", "s"].map((k) => params.get(k) ?? "");
  if (!b || !p || !e || !s || Number(e) * 1000 < Date.now()) return false;
  const expected = Buffer.from(mockSign([b, p, e, op, d]));
  const given = Buffer.from(s);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function mockUrl(b: string, p: string, ttl: number, op: "read" | "upload", downloadName = ""): string {
  const e = String(Math.floor(Date.now() / 1000) + ttl);
  const qs = new URLSearchParams({ b, p, e, op, d: downloadName, s: mockSign([b, p, e, op, downloadName]) });
  return `${appUrl()}/api/mock-storage?${qs}`;
}

function localStore(): FileStore {
  return {
    async createUploadUrl(b, p) {
      return mockUrl(b, p, 2 * 60 * 60, "upload");
    },
    async upload(b, p, bytes) {
      const file = mockFilePath(b, p);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes);
    },
    async download(b, p) {
      return new Uint8Array(await readFile(mockFilePath(b, p)));
    },
    async signedUrl(b, p, ttl, downloadName) {
      return mockUrl(b, p, ttl, "read", downloadName);
    },
    async remove(b, ps) {
      await Promise.all(ps.map((p) => rm(mockFilePath(b, p), { force: true })));
    },
  };
}
