import "server-only";
import { z } from "zod";
import type { SettingsDto } from "@/lib/domain";
import type { AdminContext } from "@/server/context";
import { getDocumentRow, logEvent, refreshStatus } from "@/server/repo/documents";
import { updateSettings } from "@/server/repo/settings";
import { fileStore, paths } from "@/server/storage";
import type { Result } from "./documents";
import { cleanSignaturePng, SignatureImageError } from "./signing";

const dataUrlSchema = z
  .string()
  .max(800_000)
  .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);

function pngFromDataUrl(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

// ---------------------------------------------------------------------------
// The admin's saved signature (profile)
// ---------------------------------------------------------------------------

export async function getSavedSignature(ctx: AdminContext): Promise<{ path: string; url: string } | null> {
  const [row] = await ctx.db.query<{ saved_signature_path: string | null }>(
    `select saved_signature_path from public.admin_profiles where user_id = $1`,
    [ctx.admin.userId],
  );
  if (!row?.saved_signature_path) return null;
  return { path: row.saved_signature_path, url: await fileStore().signedUrl("signatures", row.saved_signature_path, 60 * 60) };
}

async function storeSavedSignature(ctx: AdminContext, png: Buffer): Promise<string> {
  const previous = await getSavedSignature(ctx);
  const path = paths.adminSignature(ctx.admin.userId, Date.now());
  await fileStore().upload("signatures", path, png, "image/png");
  await ctx.db.query(`update public.admin_profiles set saved_signature_path = $2 where user_id = $1`, [ctx.admin.userId, path]);
  if (previous) await fileStore().remove("signatures", [previous.path]).catch(() => {});
  return path;
}

export async function saveProfileSignature(ctx: AdminContext, dataUrl: string): Promise<Result<object, "invalid" | "image">> {
  if (!dataUrlSchema.safeParse(dataUrl).success) return { ok: false, error: "invalid" };
  try {
    await storeSavedSignature(ctx, await cleanSignaturePng(pngFromDataUrl(dataUrl)));
    return { ok: true };
  } catch (err) {
    if (err instanceof SignatureImageError) return { ok: false, error: "image" };
    throw err;
  }
}

export async function deleteProfileSignature(ctx: AdminContext): Promise<void> {
  const previous = await getSavedSignature(ctx);
  await ctx.db.query(`update public.admin_profiles set saved_signature_path = null where user_id = $1`, [ctx.admin.userId]);
  if (previous) await fileStore().remove("signatures", [previous.path]).catch(() => {});
}

// ---------------------------------------------------------------------------
// Blue pen: the admin signs a document too
// ---------------------------------------------------------------------------

const adminSignSchema = z.object({
  documentId: z.uuid(),
  /** Reuse the signature saved on the profile, or send a new drawing. */
  useSaved: z.boolean(),
  dataUrl: dataUrlSchema.optional(),
  saveToProfile: z.boolean().default(false),
});

export type AdminSignError = "invalid" | "not_found" | "not_required" | "already_signed" | "finalized" | "no_saved" | "image";

export async function adminSign(ctx: AdminContext, input: z.input<typeof adminSignSchema>): Promise<Result<object, AdminSignError>> {
  const parsed = adminSignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { documentId, useSaved, dataUrl, saveToProfile } = parsed.data;

  const doc = await getDocumentRow(ctx.db, documentId);
  if (!doc || doc.status === "draft") return { ok: false, error: "not_found" };
  if (doc.status === "finalized") return { ok: false, error: "finalized" };
  const [slot] = await ctx.db.query<{ id: string; status: "pending" | "signed" }>(
    `select id, status from public.signers where document_id = $1 and is_admin`,
    [documentId],
  );
  if (!slot || !doc.admin_signs) return { ok: false, error: "not_required" };
  if (slot.status === "signed") return { ok: false, error: "already_signed" };

  let png: Uint8Array;
  if (useSaved) {
    const saved = await getSavedSignature(ctx);
    if (!saved) return { ok: false, error: "no_saved" };
    png = await fileStore().download("signatures", saved.path);
  } else {
    if (!dataUrl) return { ok: false, error: "invalid" };
    try {
      png = await cleanSignaturePng(pngFromDataUrl(dataUrl));
    } catch (err) {
      if (err instanceof SignatureImageError) return { ok: false, error: "image" };
      throw err;
    }
    if (saveToProfile) await storeSavedSignature(ctx, Buffer.from(png));
  }

  const objectPath = paths.signature(documentId, slot.id, Date.now());
  await fileStore().upload("signatures", objectPath, png, "image/png");
  const result = await ctx.db.tx(async (db): Promise<Result<object, AdminSignError>> => {
    const current = await getDocumentRow(db, documentId, { forUpdate: true });
    if (!current || current.status === "finalized") return { ok: false, error: "finalized" };
    const updated = await db.query(
      `update public.signers set status = 'signed', signature_path = $2, signature_method = 'draw',
              signed_at = now(), signed_ip = $3::inet, signed_user_agent = $4, admin_user_id = $5
        where id = $1 and status = 'pending'
        returning id`,
      [slot.id, objectPath, ctx.ip, ctx.userAgent, ctx.admin.userId],
    );
    if (!updated.length) return { ok: false, error: "already_signed" };
    await logEvent(db, {
      documentId,
      signerId: slot.id,
      event: "signed",
      actorUserId: ctx.admin.userId,
      details: { method: "draw", admin: true, reused_saved: useSaved },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    await refreshStatus(db, documentId);
    return { ok: true };
  });
  if (!result.ok) await fileStore().remove("signatures", [objectPath]).catch(() => {});
  return result;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  allow_typed_signature: z.boolean(),
  allow_checkbox_signature: z.boolean(),
  default_link_mode: z.enum(["per_signer", "shared"]),
  message_template: z.string().max(2000).transform((s) => s.replace(/\r\n/g, "\n").trim()),
});

export async function saveSettings(ctx: AdminContext, input: SettingsDto): Promise<Result<object, "invalid">> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await updateSettings(ctx.db, parsed.data);
  return { ok: true };
}
