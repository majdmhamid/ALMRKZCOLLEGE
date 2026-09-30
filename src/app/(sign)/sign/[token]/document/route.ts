import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/features/signing/server/db";
import { canViewDocument, cookieNames, openSession, resolveToken } from "@/features/signing/server/services/signing";
import { fileStore } from "@/features/signing/server/storage";

/**
 * The PDF for someone who may sign it now: a 10-minute signed URL. Personal link:
 * the link itself (while unsigned). Shared link: only after the name step (signed
 * cookie for this exact link). Read-only view of the ORIGINAL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const resolved = await resolveToken(db, token);
  const notFound = new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  if (!resolved || !resolved.doc.original_pdf_path) return notFound;

  const session = openSession((await cookies()).get(cookieNames(resolved.tokenHash).session)?.value, resolved.tokenHash);
  if (!canViewDocument(resolved, session)) return notFound;

  const url = await fileStore().signedUrl("originals", resolved.doc.original_pdf_path, 10 * 60);
  return NextResponse.json({ url }, { headers: { "cache-control": "no-store" } });
}
