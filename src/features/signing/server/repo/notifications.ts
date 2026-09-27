import "server-only";
import type { Db } from "@/features/signing/server/db";

export type NotificationItem = {
  id: string;
  document_id: string;
  document_title: string;
  signer_name: string | null;
  created_at: string;
  read_at: string | null;
};

export async function unreadCount(db: Db): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    `select count(*)::int as n from public.notifications n
       join public.documents d on d.id = n.document_id
      where n.read_at is null and d.deleted_at is null`,
  );
  return row?.n ?? 0;
}

export async function recentNotifications(db: Db, limit = 20): Promise<NotificationItem[]> {
  return db.query<NotificationItem>(
    `select n.id, n.document_id, d.title as document_title, s.name as signer_name, n.created_at, n.read_at
       from public.notifications n
       join public.documents d on d.id = n.document_id
       left join public.signers s on s.id = n.signer_id
      where d.deleted_at is null
      order by n.created_at desc
      limit $1`,
    [limit],
  );
}

export async function markAllRead(db: Db): Promise<void> {
  await db.query(`update public.notifications set read_at = now() where read_at is null`);
}

export async function createNotification(db: Db, documentId: string, signerId: string | null): Promise<void> {
  await db.query(`insert into public.notifications (document_id, signer_id) values ($1, $2)`, [documentId, signerId]);
}
