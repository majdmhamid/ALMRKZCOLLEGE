import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type Sharp } from "sharp";
import { z } from "zod";
import type { DocumentRow, SignerRow } from "@/features/signing/lib/database.types";
import { sharedLinkOpen, type SignatureMethod } from "@/features/signing/lib/domain";
import { serverEnv } from "@/features/signing/lib/env";
import { hashToken, isWellFormedToken, sha256Hex } from "@/features/signing/lib/security/crypto";
import { signPayload, verifyPayload } from "@/features/signing/lib/security/session";
import type { Db } from "@/features/signing/server/db";
import { getDocumentRow, logEvent, refreshStatus } from "@/features/signing/server/repo/documents";
import { createNotification } from "@/features/signing/server/repo/notifications";
import { getSettings } from "@/features/signing/server/repo/settings";
import { fileStore, paths } from "@/features/signing/server/storage";

/**
 * Everything the public signing page needs. Nothing here trusts the browser:
 * the link token (256 random bits) is the signer's credential and is looked up
 * by hash. No ID number is asked for. A personal link opens the document
 * directly; a shared link first asks for the signer's full name, kept in an
 * HMAC-signed, expiring cookie until they sign.
 */

export type ClientInfo = { ip: string | null; userAgent: string | null };

export type Resolved =
  | { mode: "per_signer"; tokenHash: string; doc: DocumentRow; signer: SignerRow }
  | { mode: "shared"; tokenHash: string; doc: DocumentRow };

export async function resolveToken(db: Db, token: string): Promise<Resolved | null> {
  if (!isWellFormedToken(token)) return null;
  const tokenHash = hashToken(token);
  const [signer] = await db.query<SignerRow>(`select * from public.signers where token_hash = $1`, [tokenHash]);
  if (signer) {
    const doc = await getDocumentRow(db, signer.document_id);
    if (!doc || doc.status === "draft") return null;
    return { mode: "per_signer", tokenHash, doc, signer };
  }
  const [doc] = await db.query<DocumentRow>(
    `select * from public.documents where shared_token_hash = $1 and deleted_at is null and status <> 'draft'`,
    [tokenHash],
  );
  return doc ? { mode: "shared", tokenHash, doc } : null;
}

// ---------------------------------------------------------------------------
// Cookies
// ---------------------------------------------------------------------------

export const SESSION_TTL_SECONDS = 2 * 60 * 60;

/** Shared link: the name this browser gave before signing (`t` = the link's token hash). */
export type SignSession = { t: string; n?: string };

export const cookieNames = (tokenHash: string) => ({
  session: `sgn_s_${tokenHash.slice(0, 16)}`,
  /** Shared mode: this browser already signed (so reopening shows "already signed"). */
  done: `sgn_d_${tokenHash.slice(0, 16)}`,
});

export function sealSession(session: SignSession): string {
  return signPayload(session, serverEnv().SESSION_SECRET, SESSION_TTL_SECONDS);
}

export function openSession(value: string | undefined, tokenHash: string): SignSession | null {
  const s = verifyPayload<SignSession>(value, serverEnv().SESSION_SECRET);
  return s && s.t === tokenHash ? s : null;
}

export function sealDone(tokenHash: string, signerId: string): string {
  return signPayload({ t: tokenHash, s: signerId }, serverEnv().SESSION_SECRET, 365 * 24 * 60 * 60);
}

export function openDone(value: string | undefined, tokenHash: string): string | null {
  const s = verifyPayload<{ t: string; s: string }>(value, serverEnv().SESSION_SECRET);
  return s && s.t === tokenHash ? s.s : null;
}

// ---------------------------------------------------------------------------
// What the page shows
// ---------------------------------------------------------------------------

export type SignView =
  | { state: "invalid" }
  | { state: "closed"; title: string }
  | { state: "already_signed"; title: string; canSignAnother: boolean }
  /** Shared link only: ask for the signer's full name first. */
  | { state: "name"; mode: "shared"; title: string; description: string | null; signerName: null }
  | {
      state: "sign";
      mode: "per_signer" | "shared";
      title: string;
      description: string | null;
      signerName: string;
      pageCount: number;
      methods: { typed: boolean; checkbox: boolean };
    };

async function signerCounts(db: Db, documentId: string) {
  return db.query<{ status: "pending" | "signed"; is_admin: boolean }>(
    `select status, is_admin from public.signers where document_id = $1`,
    [documentId],
  );
}

export async function sharedIsOpen(db: Db, doc: DocumentRow): Promise<boolean> {
  return sharedLinkOpen({ ...doc, signers: await signerCounts(db, doc.id) });
}

export async function viewFor(
  db: Db,
  resolved: Resolved | null,
  cookies: { session?: string; done?: string },
): Promise<SignView> {
  if (!resolved) return { state: "invalid" };
  const { doc } = resolved;
  const base = { title: doc.title };

  let signerName: string;
  if (resolved.mode === "per_signer") {
    if (resolved.signer.status === "signed") return { state: "already_signed", ...base, canSignAnother: false };
    if (doc.status === "finalized") return { state: "closed", ...base };
    signerName = resolved.signer.name;
  } else {
    if (openDone(cookies.done, resolved.tokenHash)) return { state: "already_signed", ...base, canSignAnother: true };
    if (doc.status === "finalized" || !(await sharedIsOpen(db, doc))) return { state: "closed", ...base };
    const session = openSession(cookies.session, resolved.tokenHash);
    if (!session?.n) return { state: "name", mode: "shared", ...base, description: doc.description, signerName: null };
    signerName = session.n;
  }

  const settings = await getSettings(db);
  return {
    state: "sign",
    mode: resolved.mode,
    ...base,
    description: doc.description,
    signerName,
    pageCount: doc.page_count ?? 1,
    methods: { typed: settings.allow_typed_signature, checkbox: settings.allow_checkbox_signature },
  };
}

/** May this link see the original PDF now? Personal link: not signed yet. Shared link: gave a name. */
export function canViewDocument(resolved: Resolved, session: SignSession | null): boolean {
  if (resolved.doc.status === "finalized") return false;
  return resolved.mode === "per_signer" ? resolved.signer.status === "pending" : !!session?.n;
}

// ---------------------------------------------------------------------------
// Shared link: the signer's name
// ---------------------------------------------------------------------------

export type StartError = "bad_name" | "invalid_link" | "closed";
export type StartResult = { ok: true; session: SignSession } | { ok: false; error: StartError };

/** Letters (any script), spaces and the usual name punctuation; at least two letters. */
export const signerNameSchema = z
  .string()
  .max(400)
  .transform((v) => v.normalize("NFC").replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(2)
      .max(120)
      .regex(/^\p{L}[\p{L}\p{M} .'’‘`׳״\-]*$/u)
      .refine((v) => (v.match(/\p{L}/gu) ?? []).length >= 2),
  );

/**
 * Shared link: the signer types their full name, which goes on the signature and
 * in the audit trail. The same name may sign more than once (two students can
 * share a name) — each signature is its own row with its own time, IP and device.
 */
export async function startShared(db: Db, resolved: Resolved | null, input: { name: string }): Promise<StartResult> {
  if (!resolved || resolved.mode !== "shared") return { ok: false, error: "invalid_link" };
  const name = signerNameSchema.safeParse(input?.name ?? "");
  if (!name.success) return { ok: false, error: "bad_name" };
  const { doc } = resolved;
  if (doc.status === "finalized" || !(await sharedIsOpen(db, doc))) return { ok: false, error: "closed" };
  return { ok: true, session: { t: resolved.tokenHash, n: name.data } };
}

// ---------------------------------------------------------------------------
// Signature image
// ---------------------------------------------------------------------------

export const MAX_SIGNATURE_BYTES = 512 * 1024;

export class SignatureImageError extends Error {}

/**
 * Accepts a PNG only, trims the empty border, keeps a transparent background,
 * and refuses blank images. Returns the cleaned PNG.
 */
export async function cleanSignaturePng(bytes: Uint8Array): Promise<Buffer> {
  const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.byteLength > MAX_SIGNATURE_BYTES || bytes.byteLength < 67) throw new SignatureImageError("size");
  if (!PNG_MAGIC.every((b, i) => bytes[i] === b)) throw new SignatureImageError("not_png");

  let image: Sharp;
  try {
    image = sharp(bytes, { limitInputPixels: 4000 * 4000 });
    const meta = await image.metadata();
    if (meta.format !== "png" || !meta.width || !meta.height || meta.width > 4000 || meta.height > 4000) {
      throw new SignatureImageError("not_png");
    }
  } catch (err) {
    if (err instanceof SignatureImageError) throw err;
    throw new SignatureImageError("not_png");
  }

  // Blank = no pixel with meaningful alpha.
  const { channels } = await sharp(bytes).ensureAlpha().stats();
  if ((channels[3]?.max ?? 0) < 16) throw new SignatureImageError("empty");

  const trimmed = await sharp(bytes)
    .ensureAlpha()
    // Transparent border → trim to the ink, keeping a small margin.
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .catch(() => {
      throw new SignatureImageError("empty");
    });
  const meta = await sharp(trimmed).metadata();
  if ((meta.width ?? 0) < 24 || (meta.height ?? 0) < 20) throw new SignatureImageError("empty");
  return trimmed;
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export type SubmitError = "invalid" | "invalid_link" | "session" | "already_signed" | "closed" | "image" | "method";
export type SubmitResult = { ok: true; signerId: string } | { ok: false; error: SubmitError };

export async function submitSignature(
  db: Db,
  resolved: Resolved | null,
  session: SignSession | null,
  input: {
    method: SignatureMethod;
    png: Uint8Array;
    readConfirmed: boolean;
    /** The signer ticked «I agree to sign electronically» (חוק חתימה אלקטרונית). Kept in the audit log. */
    esignConsent?: boolean;
  },
  client: ClientInfo,
): Promise<SubmitResult> {
  if (!resolved) return { ok: false, error: "invalid_link" };
  // Personal link: the token is the credential. Shared link: the name step must have happened.
  const sharedName = resolved.mode === "shared" ? session?.n : undefined;
  if (resolved.mode === "shared" && !sharedName) return { ok: false, error: "session" };
  if (!input.readConfirmed) return { ok: false, error: "invalid" };

  const settings = await getSettings(db);
  const allowed =
    input.method === "draw" ||
    (input.method === "typed" && settings.allow_typed_signature) ||
    (input.method === "checkbox" && settings.allow_checkbox_signature);
  if (!allowed) return { ok: false, error: "method" };

  let png: Buffer;
  try {
    png = await cleanSignaturePng(input.png);
  } catch {
    return { ok: false, error: "image" };
  }

  const { doc } = resolved;
  const signerId = resolved.mode === "per_signer" ? resolved.signer.id : randomUUID();

  const objectPath = paths.signature(doc.id, signerId, Date.now());
  await fileStore().upload("signatures", objectPath, png, "image/png");

  try {
    const result = await db.tx(async (tx): Promise<SubmitResult> => {
      // Lock the document row: serializes concurrent signers on a shared link.
      const current = await getDocumentRow(tx, doc.id, { forUpdate: true });
      if (!current || current.status === "finalized" || current.status === "draft") return { ok: false, error: "closed" };

      if (resolved.mode === "per_signer") {
        const updated = await tx.query<{ id: string }>(
          `update public.signers set status = 'signed', signature_path = $2, signature_method = $3,
                  signed_at = now(), signed_ip = $4::inet, signed_user_agent = $5
            where id = $1 and status = 'pending' and token_hash = $6
            returning id`,
          [signerId, objectPath, input.method, client.ip, client.userAgent, resolved.tokenHash],
        );
        if (!updated.length) return { ok: false, error: "already_signed" };
      } else {
        if (current.shared_token_hash !== resolved.tokenHash) return { ok: false, error: "invalid_link" };
        if (!(await sharedIsOpen(tx, current))) return { ok: false, error: "closed" };
        await tx.query(
          `insert into public.signers (id, document_id, name, status,
             signature_path, signature_method, signed_at, signed_ip, signed_user_agent)
           values ($1, $2, $3, 'signed', $4, $5, now(), $6::inet, $7)`,
          [signerId, doc.id, sharedName, objectPath, input.method, client.ip, client.userAgent],
        );
      }

      await createNotification(tx, doc.id, signerId);
      await logEvent(tx, {
        documentId: doc.id,
        signerId,
        event: "signed",
        details: {
          method: input.method,
          // What identified the signer: their personal link, or a shared link + the name they typed.
          link_mode: resolved.mode,
          signature_sha256: sha256Hex(png),
          read_confirmed: true,
          esign_consent: Boolean(input.esignConsent),
        },
        ip: client.ip,
        userAgent: client.userAgent,
      });
      await refreshStatus(tx, doc.id);
      return { ok: true, signerId };
    });
    if (!result.ok) await fileStore().remove("signatures", [objectPath]).catch(() => {});
    return result;
  } catch (err) {
    await fileStore().remove("signatures", [objectPath]).catch(() => {});
    throw err;
  }
}

/** Logs "opened" at most once per IP per link per hour. */
export async function logOpened(db: Db, resolved: Resolved, client: ClientInfo, allowed: boolean): Promise<void> {
  if (!allowed) return;
  await logEvent(db, {
    documentId: resolved.doc.id,
    signerId: resolved.mode === "per_signer" ? resolved.signer.id : null,
    event: "opened",
    ip: client.ip,
    userAgent: client.userAgent,
  });
}
