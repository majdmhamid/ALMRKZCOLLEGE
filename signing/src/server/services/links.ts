import "server-only";
import { z } from "zod";
import type { SignerStatus } from "@/lib/domain";
import { appUrl, serverEnv } from "@/lib/env";
import { decryptToken, mintToken } from "@/lib/security/crypto";
import { buildShareMessage, signingUrl } from "@/lib/share";
import type { AdminContext } from "@/server/context";
import { getDocumentRow, logEvent } from "@/server/repo/documents";
import { getSettings } from "@/server/repo/settings";
import type { Result } from "./documents";

export type ShareLink = {
  /** null = the document's shared link. */
  signerId: string | null;
  name: string | null;
  phone: string | null;
  status: SignerStatus | null;
  locked: boolean;
  failedAttempts: number;
  /** null when revoked. */
  url: string | null;
  message: string | null;
};

export type ShareInfo = {
  documentId: string;
  title: string;
  linkMode: "per_signer" | "shared";
  finalized: boolean;
  lockedDevices: number;
  links: ShareLink[];
};

const idSchema = z.uuid();

function tryDecrypt(enc: string | null): string | null {
  if (!enc) return null;
  try {
    return decryptToken(enc, serverEnv().TOKEN_ENC_KEY);
  } catch {
    return null; // key changed since the link was made → admin makes a new one
  }
}

/** Decrypts the links for one document so the admin can copy / WhatsApp them. */
export async function getShareInfo(ctx: AdminContext, documentId: string): Promise<ShareInfo | null> {
  if (!idSchema.safeParse(documentId).success) return null;
  const doc = await getDocumentRow(ctx.db, documentId);
  if (!doc || doc.status === "draft") return null;
  const settings = await getSettings(ctx.db);
  const base = appUrl();
  const withMessage = (token: string | null) => {
    if (!token) return { url: null, message: null };
    const url = signingUrl(base, token);
    return { url, message: buildShareMessage({ template: settings.message_template, description: doc.description, url }) };
  };

  if (doc.link_mode === "shared") {
    const [{ n }] = await ctx.db.query<{ n: number }>(
      `select count(*)::int as n from public.shared_link_attempts where document_id = $1 and locked`,
      [doc.id],
    );
    return {
      documentId: doc.id,
      title: doc.title,
      linkMode: "shared",
      finalized: doc.status === "finalized",
      lockedDevices: n,
      links: [
        {
          signerId: null,
          name: null,
          phone: null,
          status: null,
          locked: false,
          failedAttempts: 0,
          ...withMessage(tryDecrypt(doc.shared_token_enc)),
        },
      ],
    };
  }

  const signers = await ctx.db.query<{
    id: string;
    name: string;
    phone: string | null;
    status: SignerStatus;
    locked: boolean;
    failed_attempts: number;
    token_enc: string | null;
  }>(
    `select id, name, phone, status, locked, failed_attempts, token_enc
       from public.signers where document_id = $1 and not is_admin order by created_at`,
    [doc.id],
  );
  return {
    documentId: doc.id,
    title: doc.title,
    linkMode: "per_signer",
    finalized: doc.status === "finalized",
    lockedDevices: 0,
    links: signers.map((s) => ({
      signerId: s.id,
      name: s.name,
      phone: s.phone,
      status: s.status,
      locked: s.locked,
      failedAttempts: s.failed_attempts,
      ...withMessage(s.status === "signed" ? null : tryDecrypt(s.token_enc)),
    })),
  };
}

const linkRef = z.object({ documentId: z.uuid(), signerId: z.uuid().nullable() });
type LinkRef = z.input<typeof linkRef>;
type LinkError = "invalid" | "not_found" | "finalized" | "signed";

async function loadTarget(ctx: AdminContext, ref: LinkRef) {
  const parsed = linkRef.safeParse(ref);
  if (!parsed.success) return { error: "invalid" as const };
  const doc = await getDocumentRow(ctx.db, parsed.data.documentId);
  if (!doc || doc.status === "draft") return { error: "not_found" as const };
  if (doc.status === "finalized") return { error: "finalized" as const };
  if (parsed.data.signerId === null) {
    if (doc.link_mode !== "shared") return { error: "invalid" as const };
    return { doc, signerId: null };
  }
  const [signer] = await ctx.db.query<{ id: string; status: SignerStatus; is_admin: boolean }>(
    `select id, status, is_admin from public.signers where id = $1 and document_id = $2`,
    [parsed.data.signerId, doc.id],
  );
  if (!signer || signer.is_admin) return { error: "not_found" as const };
  if (signer.status === "signed") return { error: "signed" as const };
  return { doc, signerId: signer.id };
}

function audit(ctx: AdminContext, documentId: string, signerId: string | null, event: "link_copied" | "link_revoked" | "link_regenerated" | "link_reset") {
  return logEvent(ctx.db, { documentId, signerId, event, actorUserId: ctx.admin.userId, ip: ctx.ip, userAgent: ctx.userAgent });
}

export async function revokeLink(ctx: AdminContext, ref: LinkRef): Promise<Result<object, LinkError>> {
  const target = await loadTarget(ctx, ref);
  if ("error" in target) return { ok: false, error: target.error! };
  if (target.signerId) {
    await ctx.db.query(`update public.signers set token_hash = null, token_enc = null where id = $1`, [target.signerId]);
  } else {
    await ctx.db.query(`update public.documents set shared_token_hash = null, shared_token_enc = null where id = $1`, [target.doc.id]);
  }
  await audit(ctx, target.doc.id, target.signerId, "link_revoked");
  return { ok: true };
}

/** New link (the old one stops working). Also clears a lockout on that link. */
export async function regenerateLink(ctx: AdminContext, ref: LinkRef): Promise<Result<object, LinkError>> {
  const target = await loadTarget(ctx, ref);
  if ("error" in target) return { ok: false, error: target.error! };
  const token = mintToken(serverEnv().TOKEN_ENC_KEY);
  if (target.signerId) {
    await ctx.db.query(
      `update public.signers set token_hash = $2, token_enc = $3, failed_attempts = 0, locked = false where id = $1`,
      [target.signerId, token.hash, token.enc],
    );
  } else {
    await ctx.db.query(`update public.documents set shared_token_hash = $2, shared_token_enc = $3 where id = $1`, [
      target.doc.id,
      token.hash,
      token.enc,
    ]);
  }
  await audit(ctx, target.doc.id, target.signerId, "link_regenerated");
  return { ok: true };
}

/** Unlocks after 5 wrong ID attempts: one signer, or every locked device on a shared link. */
export async function resetLock(ctx: AdminContext, ref: LinkRef): Promise<Result<object, LinkError>> {
  const target = await loadTarget(ctx, ref);
  if ("error" in target) return { ok: false, error: target.error! };
  if (target.signerId) {
    await ctx.db.query(`update public.signers set failed_attempts = 0, locked = false where id = $1`, [target.signerId]);
  } else {
    await ctx.db.query(`delete from public.shared_link_attempts where document_id = $1`, [target.doc.id]);
  }
  await audit(ctx, target.doc.id, target.signerId, "link_reset");
  return { ok: true };
}

export async function recordLinkCopied(ctx: AdminContext, ref: LinkRef): Promise<void> {
  const parsed = linkRef.safeParse(ref);
  if (!parsed.success) return;
  const doc = await getDocumentRow(ctx.db, parsed.data.documentId);
  if (doc) await audit(ctx, doc.id, parsed.data.signerId, "link_copied");
}
