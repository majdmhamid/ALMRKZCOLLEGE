import "server-only";
import type { AuditEventType, DocumentRow, LinkMode } from "@/features/signing/lib/database.types";
import type { DocumentListItem, DocumentStats, SignerSummary } from "@/features/signing/lib/domain";
import { nextStatus } from "@/features/signing/lib/domain";
import { jsonList, type Db } from "@/features/signing/server/db";

// Columns safe to send to the admin UI. Token hashes / ciphertexts never leave the server.
const DOC_COLUMNS = `
  d.id, d.title, d.category, d.description, d.file_name,
  d.original_size_bytes, d.final_size_bytes, d.page_count,
  (d.original_pdf_path is not null and d.original_sha256 is not null) as has_file,
  d.link_mode, d.max_signers, d.admin_signs, d.status, d.in_signed_section,
  d.moved_to_signed_at, d.finalized_at, d.created_at, d.updated_at,
  (d.shared_token_hash is not null) as has_shared_link`;

const SIGNERS_JSON = `
  coalesce((
    select json_agg(json_build_object(
      'id', s.id, 'name', s.name, 'status', s.status, 'is_admin', s.is_admin,
      'phone', s.phone, 'id_last3', s.id_number_last3, 'locked', s.locked,
      'failed_attempts', s.failed_attempts, 'signed_at', s.signed_at,
      'signature_method', s.signature_method, 'has_link', s.token_hash is not null
    ) order by s.is_admin, s.created_at)
    from public.signers s where s.document_id = d.id
  ), '[]'::json) as signers`;

type ListRow = Omit<DocumentListItem, "signers"> & { signers: SignerSummary[] | string };

function toItem(row: ListRow): DocumentListItem {
  const signers = typeof row.signers === "string" ? (JSON.parse(row.signers) as SignerSummary[]) : row.signers;
  return {
    ...row,
    signers: signers.map((s) => ({ ...s, signed_at: s.signed_at ? new Date(s.signed_at).toISOString() : null })),
  };
}

export async function listDocuments(db: Db, section: "active" | "signed"): Promise<DocumentListItem[]> {
  const rows = await db.query<ListRow>(
    `select ${DOC_COLUMNS}, ${SIGNERS_JSON}
       from public.documents d
      where d.deleted_at is null and d.in_signed_section = $1
      order by d.created_at desc`,
    [section === "signed"],
  );
  return rows.map(toItem);
}

export async function getDocumentItem(db: Db, id: string): Promise<DocumentListItem | null> {
  const rows = await db.query<ListRow>(
    `select ${DOC_COLUMNS}, ${SIGNERS_JSON} from public.documents d where d.id = $1 and d.deleted_at is null`,
    [id],
  );
  return rows[0] ? toItem(rows[0]) : null;
}

/** Full row, including server-only columns. Never return this to the browser. */
export async function getDocumentRow(db: Db, id: string, opts: { forUpdate?: boolean } = {}): Promise<DocumentRow | null> {
  const rows = await db.query<DocumentRow>(
    `select * from public.documents where id = $1 and deleted_at is null${opts.forUpdate ? " for update" : ""}`,
    [id],
  );
  return rows[0] ?? null;
}

export async function documentStats(db: Db): Promise<DocumentStats> {
  const [row] = await db.query<DocumentStats>(
    `select
        count(*)::int as total,
        count(*) filter (where status in ('signed', 'finalized'))::int as signed,
        count(*) filter (where status = 'pending')::int as waiting,
        count(*) filter (where status = 'finalized')::int as finalized,
        coalesce(sum(coalesce(original_size_bytes, 0) + coalesce(final_size_bytes, 0)), 0)::float8 as storage_bytes,
        (count(original_sha256) + count(final_pdf_path) + (
          select count(*) from public.signers s
          join public.documents d2 on d2.id = s.document_id
          where d2.deleted_at is null and s.signature_path is not null
        ))::int as file_count
       from public.documents
      where deleted_at is null`,
  );
  return row;
}

export async function listCategories(db: Db): Promise<string[]> {
  const rows = await db.query<{ category: string }>(
    `select category from public.documents
      where category is not null and category <> '' and deleted_at is null
      group by category order by count(*) desc, category limit 50`,
  );
  return rows.map((r) => r.category);
}

export async function createDraft(
  db: Db,
  input: { id: string; title: string; fileName: string; sizeBytes: number; path: string; linkMode: LinkMode; createdBy: string | null },
): Promise<void> {
  await db.query(
    `insert into public.documents (id, title, file_name, original_size_bytes, original_pdf_path, link_mode, status, created_by)
     values ($1, $2, $3, $4, $5, $6, 'draft', $7)`,
    [input.id, input.title, input.fileName, input.sizeBytes, input.path, input.linkMode, input.createdBy],
  );
}

export async function updateDocumentDetails(
  db: Db,
  id: string,
  patch: { title: string; category: string | null; description: string | null },
): Promise<void> {
  await db.query(
    `update public.documents set title = $2, category = $3, description = $4 where id = $1 and deleted_at is null`,
    [id, patch.title, patch.category, patch.description],
  );
}

export async function softDeleteDocuments(db: Db, ids: string[]): Promise<string[]> {
  const rows = await db.query<{ id: string }>(
    `update public.documents set deleted_at = now()
      where id in (select jsonb_array_elements_text($1::text::jsonb)::uuid) and deleted_at is null
      returning id`,
    [jsonList(ids)],
  );
  return rows.map((r) => r.id);
}

/** Hard delete — only for abandoned drafts that never got details. */
export async function deleteDraft(db: Db, id: string): Promise<boolean> {
  const rows = await db.query<{ id: string }>(
    `delete from public.documents where id = $1 and status = 'draft' returning id`,
    [id],
  );
  return rows.length > 0;
}

/**
 * Re-derives pending ↔ signed from the signers. Call inside the transaction that
 * changed a signer. Returns the new status.
 */
export async function refreshStatus(db: Db, documentId: string): Promise<string | null> {
  const doc = await getDocumentRow(db, documentId, { forUpdate: true });
  if (!doc) return null;
  const signers = await db.query<{ status: "pending" | "signed"; is_admin: boolean }>(
    `select status, is_admin from public.signers where document_id = $1`,
    [documentId],
  );
  const status = nextStatus({ ...doc, signers });
  if (status !== doc.status) {
    await db.query(`update public.documents set status = $2 where id = $1`, [documentId, status]);
  }
  return status;
}

export async function logEvent(
  db: Db,
  e: {
    documentId: string;
    event: AuditEventType;
    signerId?: string | null;
    actorUserId?: string | null;
    details?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
  },
): Promise<void> {
  await db.query(
    `insert into public.audit_events (document_id, signer_id, event, actor_user_id, details, ip, user_agent)
     values ($1, $2, $3, $4, $5::text::jsonb, $6::inet, $7)`,
    [
      e.documentId,
      e.signerId ?? null,
      e.event,
      e.actorUserId ?? null,
      JSON.stringify(e.details ?? {}),
      e.ip ?? null,
      e.userAgent ?? null,
    ],
  );
}
