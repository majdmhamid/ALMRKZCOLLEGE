import "server-only";
import { z } from "zod";
import { allSigned } from "@/features/signing/lib/domain";
import { sha256Hex } from "@/features/signing/lib/security/crypto";
import type { AdminContext } from "@/features/signing/server/context";
import { getDocumentRow, logEvent, refreshStatus } from "@/features/signing/server/repo/documents";
import { listPlacements } from "@/features/signing/server/repo/placements";
import { stampSignatures } from "@/features/signing/server/stamp";
import { fileStore, paths } from "@/features/signing/server/storage";
import type { Result } from "./documents";

export type FinalizeError = "invalid" | "not_found" | "already_final" | "not_all_signed" | "no_placements" | "tampered";

/**
 * Stamps every placement onto the ORIGINAL PDF and stores the result as a NEW
 * file. The original is never overwritten; its hash is re-checked first.
 */
export async function finalizeDocument(ctx: AdminContext, documentId: string): Promise<Result<{ sha256: string }, FinalizeError>> {
  if (!z.uuid().safeParse(documentId).success) return { ok: false, error: "invalid" };
  const doc = await getDocumentRow(ctx.db, documentId);
  if (!doc || doc.status === "draft" || !doc.original_pdf_path) return { ok: false, error: "not_found" };
  if (doc.status === "finalized") return { ok: false, error: "already_final" };

  const signers = await ctx.db.query<{ id: string; status: "pending" | "signed"; is_admin: boolean; signature_path: string | null }>(
    `select id, status, is_admin, signature_path from public.signers where document_id = $1`,
    [documentId],
  );
  if (!allSigned({ ...doc, signers })) return { ok: false, error: "not_all_signed" };
  const placements = await listPlacements(ctx.db, documentId);
  if (!placements.length) return { ok: false, error: "no_placements" };

  const original = await fileStore().download("originals", doc.original_pdf_path);
  if (doc.original_sha256 && sha256Hex(original) !== doc.original_sha256) return { ok: false, error: "tampered" };

  const images = new Map<string, Uint8Array>();
  for (const s of signers) {
    if (s.signature_path && placements.some((p) => p.signer_id === s.id)) {
      images.set(s.id, await fileStore().download("signatures", s.signature_path));
    }
  }
  const stamped = await stampSignatures(
    original,
    placements.map((p) => ({ ...p, signerId: p.signer_id })),
    images,
  );
  const finalSha = sha256Hex(stamped);
  const finalPath = paths.final(documentId, Date.now());
  await fileStore().upload("finals", finalPath, stamped, "application/pdf");

  const result = await ctx.db.tx(async (db): Promise<Result<{ sha256: string }, FinalizeError>> => {
    // Someone may have finalized or changed things while we were stamping.
    const current = await getDocumentRow(db, documentId, { forUpdate: true });
    if (!current || current.status === "finalized") return { ok: false, error: "already_final" };
    await db.query(
      `update public.documents set status = 'finalized', final_pdf_path = $2, final_sha256 = $3,
              final_size_bytes = $4, finalized_at = now()
        where id = $1`,
      [documentId, finalPath, finalSha, stamped.byteLength],
    );
    await logEvent(db, {
      documentId,
      event: "finalized",
      actorUserId: ctx.admin.userId,
      details: { sha256: finalSha, original_sha256: doc.original_sha256, placements: placements.length, bytes: stamped.byteLength },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { ok: true, sha256: finalSha };
  });
  if (!result.ok) await fileStore().remove("finals", [finalPath]).catch(() => {});
  return result;
}

/** "Unlock / edit again": discards the final PDF and reopens the editor. Logged. */
export async function unlockDocument(ctx: AdminContext, documentId: string): Promise<Result<object, "invalid" | "not_found" | "not_final">> {
  if (!z.uuid().safeParse(documentId).success) return { ok: false, error: "invalid" };
  const discarded = await ctx.db.tx(async (db): Promise<{ error: "not_found" | "not_final" } | { path: string }> => {
    const doc = await getDocumentRow(db, documentId, { forUpdate: true });
    if (!doc) return { error: "not_found" as const };
    if (doc.status !== "finalized" || !doc.final_pdf_path) return { error: "not_final" as const };
    await db.query(
      `update public.documents set status = 'signed', final_pdf_path = null, final_sha256 = null,
              final_size_bytes = null, finalized_at = null
        where id = $1`,
      [documentId],
    );
    await refreshStatus(db, documentId);
    await logEvent(db, {
      documentId,
      event: "unlocked",
      actorUserId: ctx.admin.userId,
      details: { discarded_sha256: doc.final_sha256 },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { path: doc.final_pdf_path };
  });
  if ("error" in discarded) return { ok: false, error: discarded.error };
  await fileStore().remove("finals", [discarded.path]).catch(() => {});
  return { ok: true };
}

/** Manual move between "Documents" and "Signed". Only signed/finalized documents can go to Signed. */
export async function moveDocuments(
  ctx: AdminContext,
  ids: string[],
  toSigned: boolean,
): Promise<Result<{ moved: number; skipped: number }, "invalid">> {
  const parsed = z.array(z.uuid()).min(1).max(200).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "invalid" };
  return ctx.db.tx(async (db) => {
    const rows = await db.query<{ id: string }>(
      toSigned
        ? `update public.documents set in_signed_section = true, moved_to_signed_at = now()
             where id in (select jsonb_array_elements_text($1::jsonb)::uuid)
               and deleted_at is null and not in_signed_section and status in ('signed', 'finalized')
           returning id`
        : `update public.documents set in_signed_section = false, moved_to_signed_at = null
             where id in (select jsonb_array_elements_text($1::jsonb)::uuid)
               and deleted_at is null and in_signed_section
           returning id`,
      [JSON.stringify(parsed.data)],
    );
    for (const { id } of rows) {
      await logEvent(db, {
        documentId: id,
        event: toSigned ? "moved_to_signed" : "moved_back",
        actorUserId: ctx.admin.userId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }
    return { ok: true, moved: rows.length, skipped: parsed.data.length - rows.length };
  });
}
