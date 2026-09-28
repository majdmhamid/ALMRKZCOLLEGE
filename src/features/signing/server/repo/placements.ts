import "server-only";
import type { Db } from "@/features/signing/server/db";

export type Placement = {
  id: string;
  signer_id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function listPlacements(db: Db, documentId: string): Promise<Placement[]> {
  return db.query<Placement>(
    `select id, signer_id, page, x, y, width, height from public.placements
      where document_id = $1 order by page, created_at`,
    [documentId],
  );
}

/**
 * Replaces the document's placements with `items` (the editor always saves the
 * whole set). Returns true when placements were added or removed — moves and
 * resizes alone don't count, so the audit log isn't flooded by dragging.
 */
export async function replacePlacements(db: Db, documentId: string, items: Placement[]): Promise<boolean> {
  const before = await db.query<{ id: string }>(`select id from public.placements where document_id = $1`, [documentId]);
  const beforeIds = new Set(before.map((r) => r.id));
  const afterIds = new Set(items.map((p) => p.id));

  const removed = [...beforeIds].filter((id) => !afterIds.has(id));
  if (removed.length) {
    await db.query(
      `delete from public.placements where document_id = $1 and id in (select jsonb_array_elements_text($2::text::jsonb)::uuid)`,
      [documentId, JSON.stringify(removed)],
    );
  }
  for (const p of items) {
    await db.query(
      `insert into public.placements (id, document_id, signer_id, page, x, y, width, height)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set page = excluded.page, x = excluded.x, y = excluded.y,
         width = excluded.width, height = excluded.height
       where public.placements.document_id = excluded.document_id`,
      [p.id, documentId, p.signer_id, p.page, p.x, p.y, p.width, p.height],
    );
  }
  return removed.length > 0 || items.some((p) => !beforeIds.has(p.id));
}
