import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import sharp, { type Sharp } from "sharp";
import { z } from "zod";
import type { DocumentRow, SignerRow } from "@/features/signing/lib/database.types";
import { MAX_ID_ATTEMPTS, sharedLinkOpen, type SignatureMethod } from "@/features/signing/lib/domain";
import { serverEnv } from "@/features/signing/lib/env";
import { hashIdNumber, hashToken, isWellFormedToken, safeEqualHex, sha256Hex } from "@/features/signing/lib/security/crypto";
import { idLast3, isValidIsraeliId, normalizeIsraeliId } from "@/features/signing/lib/security/israeli-id";
import { signPayload, verifyPayload } from "@/features/signing/lib/security/session";
import type { Db } from "@/features/signing/server/db";
import { getDocumentRow, logEvent, refreshStatus } from "@/features/signing/server/repo/documents";
import { createNotification } from "@/features/signing/server/repo/notifications";
import { getSettings } from "@/features/signing/server/repo/settings";
import { fileStore, paths } from "@/features/signing/server/storage";

/**
 * Everything the public signing page needs. Nothing here trusts the browser:
 * the token is looked up by hash, the ID is compared as an HMAC, and the
 * "verified" state lives in an HMAC-signed, expiring cookie.
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

/** What the "ID verified" cookie proves. Shared mode carries the typed name + ID hash. */
export type SignSession = { t: string; s?: string; n?: string; h?: string; l?: string };

export const cookieNames = (tokenHash: string) => ({
  session: `sgn_s_${tokenHash.slice(0, 16)}`,
  /** Shared mode: this browser already signed (so reopening shows "already signed"). */
  done: `sgn_d_${tokenHash.slice(0, 16)}`,
});
export const DEVICE_COOKIE = "sgn_device";

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

export function newDeviceId(): string {
  return randomBytes(16).toString("base64url");
}

/** Per-document device key, so one device id can't be correlated across documents in the DB. */
export function deviceKey(deviceId: string, documentId: string): string {
  return sha256Hex(`${documentId}:${deviceId}`);
}

// ---------------------------------------------------------------------------
// What the page shows
// ---------------------------------------------------------------------------

export type SignView =
  | { state: "invalid" }
  | { state: "closed"; title: string }
  | { state: "locked"; title: string }
  | { state: "already_signed"; title: string; canSignAnother: boolean }
  | { state: "verify"; mode: "per_signer" | "shared"; title: string; description: string | null; signerName: string | null }
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
  cookies: { session?: string; done?: string; deviceId?: string },
): Promise<SignView> {
  if (!resolved) return { state: "invalid" };
  const { doc } = resolved;
  const base = { title: doc.title };

  if (resolved.mode === "per_signer") {
    if (resolved.signer.status === "signed") return { state: "already_signed", ...base, canSignAnother: false };
    if (doc.status === "finalized") return { state: "closed", ...base };
    if (resolved.signer.locked) return { state: "locked", ...base };
  } else {
    if (openDone(cookies.done, resolved.tokenHash)) return { state: "already_signed", ...base, canSignAnother: true };
    if (doc.status === "finalized" || !(await sharedIsOpen(db, doc))) return { state: "closed", ...base };
    if (cookies.deviceId) {
      const [attempt] = await db.query<{ locked: boolean }>(
        `select locked from public.shared_link_attempts where document_id = $1 and device_key = $2`,
        [doc.id, deviceKey(cookies.deviceId, doc.id)],
      );
      if (attempt?.locked) return { state: "locked", ...base };
    }
  }

  const session = openSession(cookies.session, resolved.tokenHash);
  const sessionValid =
    session && (resolved.mode === "shared" ? !!(session.n && session.h) : session.s === resolved.signer.id);
  if (!sessionValid) {
    return {
      state: "verify",
      mode: resolved.mode,
      ...base,
      description: doc.description,
      signerName: resolved.mode === "per_signer" ? resolved.signer.name : null,
    };
  }

  const settings = await getSettings(db);
  return {
    state: "sign",
    mode: resolved.mode,
    ...base,
    description: doc.description,
    signerName: resolved.mode === "per_signer" ? resolved.signer.name : session.n!,
    pageCount: doc.page_count ?? 1,
    methods: { typed: settings.allow_typed_signature, checkbox: settings.allow_checkbox_signature },
  };
}

// ---------------------------------------------------------------------------
// ID check
// ---------------------------------------------------------------------------

export type VerifyError = "invalid" | "invalid_link" | "bad_id" | "wrong_id" | "locked" | "already_signed" | "closed";
export type VerifyResult =
  | { ok: true; session: SignSession }
  | { ok: false; error: VerifyError; attemptsLeft?: number };

const verifySchema = z.object({
  idNumber: z.string().trim().min(1).max(20),
  name: z.string().trim().max(120).optional(),
});

export async function verifyId(
  db: Db,
  resolved: Resolved | null,
  input: z.input<typeof verifySchema>,
  client: ClientInfo & { deviceId: string },
): Promise<VerifyResult> {
  if (!resolved) return { ok: false, error: "invalid_link" };
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { doc } = resolved;
  const secret = serverEnv().ID_HMAC_SECRET;
  const log = (event: "id_failed" | "id_locked" | "id_verified", signerId: string | null, details = {}) =>
    logEvent(db, { documentId: doc.id, signerId, event, details, ip: client.ip, userAgent: client.userAgent });

  if (resolved.mode === "per_signer") {
    const { signer } = resolved;
    if (signer.status === "signed") return { ok: false, error: "already_signed" };
    if (doc.status === "finalized") return { ok: false, error: "closed" };
    if (signer.locked) return { ok: false, error: "locked" };
    // A malformed number can't be the right one; say so without counting it.
    if (!isValidIsraeliId(parsed.data.idNumber)) return { ok: false, error: "bad_id" };

    const given = hashIdNumber(parsed.data.idNumber, secret);
    if (!signer.id_number_hash || !safeEqualHex(given, signer.id_number_hash)) {
      const [state] = await db.query<{ failed_attempts: number; locked: boolean }>(
        `select * from public.signer_register_failure($1, $2)`,
        [signer.id, MAX_ID_ATTEMPTS],
      );
      await log(state.locked ? "id_locked" : "id_failed", signer.id, { attempts: state.failed_attempts });
      if (state.locked) return { ok: false, error: "locked" };
      return { ok: false, error: "wrong_id", attemptsLeft: MAX_ID_ATTEMPTS - state.failed_attempts };
    }
    await db.query(`update public.signers set failed_attempts = 0 where id = $1`, [signer.id]);
    await log("id_verified", signer.id);
    return { ok: true, session: { t: resolved.tokenHash, s: signer.id } };
  }

  // Shared link: name + a valid ID that hasn't signed this document yet.
  if (doc.status === "finalized" || !(await sharedIsOpen(db, doc))) return { ok: false, error: "closed" };
  const key = deviceKey(client.deviceId, doc.id);
  const [attempt] = await db.query<{ locked: boolean }>(
    `select locked from public.shared_link_attempts where document_id = $1 and device_key = $2`,
    [doc.id, key],
  );
  if (attempt?.locked) return { ok: false, error: "locked" };
  const name = parsed.data.name?.replace(/\s+/g, " ").trim() ?? "";
  if (name.length < 2) return { ok: false, error: "invalid" };

  const fail = async (error: "bad_id" | "already_signed") => {
    const [state] = await db.query<{ failed_attempts: number; locked: boolean }>(
      `select * from public.shared_register_failure($1, $2, $3)`,
      [doc.id, key, MAX_ID_ATTEMPTS],
    );
    await log(state.locked ? "id_locked" : "id_failed", null, { attempts: state.failed_attempts, reason: error });
    if (state.locked) return { ok: false as const, error: "locked" as const };
    return { ok: false as const, error, attemptsLeft: MAX_ID_ATTEMPTS - state.failed_attempts };
  };

  if (!isValidIsraeliId(parsed.data.idNumber)) return fail("bad_id");
  const idHash = hashIdNumber(parsed.data.idNumber, secret);
  const [existing] = await db.query(`select 1 from public.signers where document_id = $1 and id_number_hash = $2`, [
    doc.id,
    idHash,
  ]);
  if (existing) return fail("already_signed");

  await log("id_verified", null, { name });
  return {
    ok: true,
    session: { t: resolved.tokenHash, n: name, h: idHash, l: idLast3(normalizeIsraeliId(parsed.data.idNumber)!)! },
  };
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
  input: { method: SignatureMethod; png: Uint8Array; readConfirmed: boolean },
  client: ClientInfo,
): Promise<SubmitResult> {
  if (!resolved) return { ok: false, error: "invalid_link" };
  if (!session) return { ok: false, error: "session" };
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
  if (resolved.mode === "per_signer" && session.s !== signerId) return { ok: false, error: "session" };
  if (resolved.mode === "shared" && !(session.n && session.h)) return { ok: false, error: "session" };

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
        const dup = await tx.query(`select 1 from public.signers where document_id = $1 and id_number_hash = $2`, [
          doc.id,
          session.h,
        ]);
        if (dup.length) return { ok: false, error: "already_signed" };
        await tx.query(
          `insert into public.signers (id, document_id, name, id_number_hash, id_number_last3, status,
             signature_path, signature_method, signed_at, signed_ip, signed_user_agent)
           values ($1, $2, $3, $4, $5, 'signed', $6, $7, now(), $8::inet, $9)`,
          [signerId, doc.id, session.n, session.h, session.l ?? null, objectPath, input.method, client.ip, client.userAgent],
        );
      }

      await createNotification(tx, doc.id, signerId);
      await logEvent(tx, {
        documentId: doc.id,
        signerId,
        event: "signed",
        details: { method: input.method, signature_sha256: sha256Hex(png) },
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
    // Unique (document, ID) index: someone with the same ID won the race.
    if (err instanceof Error && /signers_document_id_number_uniq|duplicate key/i.test(err.message)) {
      return { ok: false, error: "already_signed" };
    }
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
