import "server-only";
import { z } from "zod";
import type { AuditEventType, SignatureMethod } from "@/features/signing/lib/domain";
import type { AdminContext } from "@/features/signing/server/context";
import { getDocumentItem, getDocumentRow, logEvent } from "@/features/signing/server/repo/documents";
import { listPlacements, replacePlacements, type Placement } from "@/features/signing/server/repo/placements";
import { fileStore } from "@/features/signing/server/storage";
import type { Result } from "./documents";

export type EditorSignature = {
  signerId: string;
  name: string;
  isAdmin: boolean;
  signedAt: string | null;
  method: SignatureMethod | null;
  /** Short-lived URL of the trimmed PNG; null while not signed yet. */
  imageUrl: string | null;
};

export type HistoryEvent = {
  id: number;
  event: AuditEventType;
  signer_name: string | null;
  details: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

const IMAGE_URL_TTL = 60 * 60;

export async function loadEditor(ctx: AdminContext, documentId: string) {
  if (!z.uuid().safeParse(documentId).success) return null;
  const doc = await getDocumentItem(ctx.db, documentId);
  if (!doc || doc.status === "draft") return null;

  const signers = await ctx.db.query<{
    id: string;
    name: string;
    is_admin: boolean;
    signed_at: string | null;
    signature_method: SignatureMethod | null;
    signature_path: string | null;
  }>(
    `select id, name, is_admin, signed_at, signature_method, signature_path
       from public.signers where document_id = $1 order by is_admin, created_at`,
    [documentId],
  );
  const signatures: EditorSignature[] = await Promise.all(
    signers.map(async (s) => ({
      signerId: s.id,
      name: s.name,
      isAdmin: s.is_admin,
      signedAt: s.signed_at,
      method: s.signature_method,
      imageUrl: s.signature_path ? await fileStore().signedUrl("signatures", s.signature_path, IMAGE_URL_TTL) : null,
    })),
  );

  const [placements, history] = await Promise.all([listPlacements(ctx.db, documentId), loadHistory(ctx, documentId)]);
  return { doc, signatures, placements, history };
}

async function loadHistory(ctx: AdminContext, documentId: string): Promise<HistoryEvent[]> {
  return ctx.db.query<HistoryEvent>(
    `select e.id, e.event, s.name as signer_name, e.details, host(e.ip) as ip, e.user_agent, e.created_at
       from public.audit_events e
       left join public.signers s on s.id = e.signer_id
      where e.document_id = $1
      order by e.created_at desc, e.id desc
      limit 500`,
    [documentId],
  );
}

const EPS = 1e-6;
const placementSchema = z
  .object({
    id: z.uuid(),
    signer_id: z.uuid(),
    page: z.number().int().min(1),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
  })
  .refine((p) => p.x + p.width <= 1 + EPS && p.y + p.height <= 1 + EPS, "outside page");

export async function savePlacements(
  ctx: AdminContext,
  documentId: string,
  items: unknown,
): Promise<Result<{ savedAt: string }, "invalid" | "not_found" | "finalized" | "bad_signer" | "bad_page">> {
  const parsed = z.array(placementSchema).max(500).safeParse(items);
  if (!parsed.success || !z.uuid().safeParse(documentId).success) return { ok: false, error: "invalid" };

  return ctx.db.tx(async (db) => {
    const doc = await getDocumentRow(db, documentId, { forUpdate: true });
    if (!doc || doc.status === "draft") return { ok: false, error: "not_found" };
    if (doc.status === "finalized") return { ok: false, error: "finalized" };

    // Only signatures that exist on THIS document can be placed.
    const signed = new Set(
      (
        await db.query<{ id: string }>(
          `select id from public.signers where document_id = $1 and status = 'signed' and signature_path is not null`,
          [documentId],
        )
      ).map((r) => r.id),
    );
    const clean: Placement[] = [];
    for (const p of parsed.data) {
      if (!signed.has(p.signer_id)) return { ok: false, error: "bad_signer" };
      if (p.page > (doc.page_count ?? 0)) return { ok: false, error: "bad_page" };
      // Clamp float noise at the page edge.
      clean.push({ ...p, width: Math.min(p.width, 1 - p.x), height: Math.min(p.height, 1 - p.y) });
    }

    const changedSet = await replacePlacements(db, documentId, clean);
    if (changedSet) {
      await logEvent(db, {
        documentId,
        event: "placed",
        actorUserId: ctx.admin.userId,
        details: { placements: clean.length },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }
    return { ok: true, savedAt: new Date().toISOString() };
  });
}
