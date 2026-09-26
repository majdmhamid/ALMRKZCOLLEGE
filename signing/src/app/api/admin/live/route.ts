import { NextResponse } from "next/server";
import { adminContext } from "@/server/context";

/**
 * Mock-mode stand-in for Supabase Realtime: a cheap "has anything changed?"
 * fingerprint the admin page polls. (With Supabase, the page subscribes to
 * postgres_changes instead and never calls this.)
 */
export async function GET() {
  const { db } = await adminContext();
  const [row] = await db.query<{ v: string }>(
    `select concat_ws('|',
        (select max(updated_at)::text from public.documents),
        (select max(updated_at)::text from public.signers),
        (select count(*)::text from public.signers),
        (select count(*)::text from public.notifications where read_at is null)) as v`,
  );
  return NextResponse.json({ v: row?.v ?? "" }, { headers: { "cache-control": "no-store" } });
}
