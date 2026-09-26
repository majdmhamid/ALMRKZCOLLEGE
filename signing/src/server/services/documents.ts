import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "@/lib/domain";
import { serverEnv } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { hashIdNumber, mintToken } from "@/lib/security/crypto";
import { idLast3, isValidIsraeliId, normalizeIsraeliId } from "@/lib/security/israeli-id";
import type { AdminUser } from "@/server/auth";
import type { Db } from "@/server/db";
import { inspectPdf, PdfError, type PdfProblem } from "@/server/pdf";
import {
  createDraft,
  deleteDraft,
  getDocumentRow,
  logEvent,
  refreshStatus,
  softDeleteDocuments,
  updateDocumentDetails,
} from "@/server/repo/documents";
import { fileStore, paths } from "@/server/storage";

type Ctx = { db: Db; admin: AdminUser; ip: string | null; userAgent: string | null };

export type Fail<E extends string> = { ok: false; error: E; field?: string; index?: number };
export type Result<T, E extends string> = ({ ok: true } & T) | Fail<E>;

// ---------------------------------------------------------------------------
// 1. Start: the browser asks for an upload URL, then PUTs the file straight to storage.
// ---------------------------------------------------------------------------

const startSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  size: z.number().int().positive(),
  linkMode: z.enum(["per_signer", "shared"]),
});

export async function startUpload(
  ctx: Ctx,
  input: z.input<typeof startSchema>,
): Promise<Result<{ documentId: string; uploadUrl: string }, "invalid" | "too_large" | "not_pdf">> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { fileName, size, linkMode } = parsed.data;
  if (size > MAX_UPLOAD_BYTES) return { ok: false, error: "too_large" };
  if (!/\.pdf$/i.test(fileName)) return { ok: false, error: "not_pdf" };

  const documentId = randomUUID();
  const objectPath = paths.original(documentId);
  await createDraft(ctx.db, {
    id: documentId,
    title: fileName.replace(/\.pdf$/i, "").slice(0, 200) || fileName,
    fileName,
    sizeBytes: size,
    path: objectPath,
    linkMode,
    createdBy: ctx.admin.userId,
  });
  const uploadUrl = await fileStore().createUploadUrl("originals", objectPath);
  return { ok: true, documentId, uploadUrl };
}

/** The admin cancelled the dialog: remove the draft and its file. */
export async function discardDraft(ctx: Ctx, documentId: string): Promise<void> {
  const doc = await getDocumentRow(ctx.db, documentId);
  if (!doc || doc.status !== "draft") return;
  if (await deleteDraft(ctx.db, documentId)) {
    await fileStore().remove("originals", [paths.original(documentId)]).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// 2. Complete: validate the uploaded PDF, save details and signers, mint links.
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const signerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  idNumber: z.string().trim().min(1).max(20),
  phone: z.string().trim().max(30).optional().default(""),
});

export const completeSchema = z.object({
  documentId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  category: optionalText(100),
  description: optionalText(2000),
  linkMode: z.enum(["per_signer", "shared"]),
  maxSigners: z.number().int().min(1).max(500).nullable().optional().transform((v) => v ?? null),
  adminSigns: z.boolean(),
  signers: z.array(signerSchema).max(50).default([]),
});

export type CompleteInput = z.input<typeof completeSchema>;
export type CompleteError =
  | "invalid"
  | "not_found"
  | "not_draft"
  | "file_missing"
  | "no_signers"
  | "bad_id"
  | "duplicate_id"
  | "bad_phone"
  | PdfProblem;

export async function completeDocument(ctx: Ctx, input: CompleteInput): Promise<Result<{ documentId: string }, CompleteError>> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: "invalid", field: issue?.path.join(".") };
  }
  const data = parsed.data;
  const env = serverEnv();

  // Signers are validated before touching storage so the admin gets quick feedback.
  const signers: { name: string; idHash: string; last3: string; phone: string | null }[] = [];
  if (data.linkMode === "per_signer") {
    if (data.signers.length === 0) return { ok: false, error: "no_signers" };
    const seen = new Set<string>();
    for (const [index, s] of data.signers.entries()) {
      if (!isValidIsraeliId(s.idNumber)) return { ok: false, error: "bad_id", index };
      const normalized = normalizeIsraeliId(s.idNumber)!;
      if (seen.has(normalized)) return { ok: false, error: "duplicate_id", index };
      seen.add(normalized);
      const phone = s.phone ? normalizePhone(s.phone) : null;
      if (s.phone && !phone) return { ok: false, error: "bad_phone", index };
      signers.push({ name: s.name, idHash: hashIdNumber(normalized, env.ID_HMAC_SECRET), last3: idLast3(normalized)!, phone });
    }
  }

  const doc = await getDocumentRow(ctx.db, data.documentId);
  if (!doc) return { ok: false, error: "not_found" };
  if (doc.status !== "draft") return { ok: false, error: "not_draft" };

  let pdf: Awaited<ReturnType<typeof inspectPdf>>;
  try {
    pdf = await inspectPdf(await fileStore().download("originals", doc.original_pdf_path ?? paths.original(doc.id)));
  } catch (err) {
    if (err instanceof PdfError) return { ok: false, error: err.problem };
    return { ok: false, error: "file_missing" };
  }

  const shared = data.linkMode === "shared" ? mintToken(env.TOKEN_ENC_KEY) : null;

  await ctx.db.tx(async (db) => {
    await db.query(
      `update public.documents set
         title = $2, category = $3, description = $4, link_mode = $5, max_signers = $6,
         admin_signs = $7, original_sha256 = $8, original_size_bytes = $9, page_count = $10,
         shared_token_hash = $11, shared_token_enc = $12, status = 'pending'
       where id = $1`,
      [
        doc.id,
        data.title,
        data.category,
        data.description,
        data.linkMode,
        data.linkMode === "shared" ? data.maxSigners : null,
        data.adminSigns,
        pdf.sha256,
        pdf.size,
        pdf.pageCount,
        shared?.hash ?? null,
        shared?.enc ?? null,
      ],
    );
    for (const s of signers) {
      const token = mintToken(env.TOKEN_ENC_KEY);
      await db.query(
        `insert into public.signers (document_id, name, id_number_hash, id_number_last3, phone, token_hash, token_enc)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [doc.id, s.name, s.idHash, s.last3, s.phone, token.hash, token.enc],
      );
    }
    if (data.adminSigns) {
      await db.query(
        `insert into public.signers (document_id, name, is_admin, admin_user_id) values ($1, $2, true, $3)`,
        [doc.id, ctx.admin.displayName || ctx.admin.email, ctx.admin.userId],
      );
    }
    await refreshStatus(db, doc.id);
    await logEvent(db, {
      documentId: doc.id,
      event: "created",
      actorUserId: ctx.admin.userId,
      details: { sha256: pdf.sha256, pages: pdf.pageCount, bytes: pdf.size, link_mode: data.linkMode, signers: signers.length },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  });

  return { ok: true, documentId: doc.id };
}

// ---------------------------------------------------------------------------
// Edit details / delete
// ---------------------------------------------------------------------------

const detailsSchema = z.object({
  documentId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  category: optionalText(100),
  description: optionalText(2000),
});

export async function editDetails(ctx: Ctx, input: z.input<typeof detailsSchema>): Promise<Result<object, "invalid" | "not_found">> {
  const parsed = detailsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { documentId, ...patch } = parsed.data;
  const doc = await getDocumentRow(ctx.db, documentId);
  if (!doc) return { ok: false, error: "not_found" };
  await ctx.db.tx(async (db) => {
    await updateDocumentDetails(db, documentId, patch);
    await logEvent(db, {
      documentId,
      event: "updated",
      actorUserId: ctx.admin.userId,
      details: { title: patch.title, category: patch.category },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  });
  return { ok: true };
}

export async function deleteDocuments(ctx: Ctx, ids: string[]): Promise<Result<{ deleted: number }, "invalid">> {
  const parsed = z.array(z.uuid()).min(1).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const deleted = await ctx.db.tx(async (db) => {
    const done = await softDeleteDocuments(db, parsed.data);
    for (const id of done) {
      await logEvent(db, { documentId: id, event: "deleted", actorUserId: ctx.admin.userId, ip: ctx.ip, userAgent: ctx.userAgent });
    }
    return done.length;
  });
  return { ok: true, deleted };
}
