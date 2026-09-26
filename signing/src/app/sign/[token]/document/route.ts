import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { cookieNames, openSession, resolveToken } from "@/server/services/signing";
import { fileStore } from "@/server/storage";

/**
 * The PDF for a signer who passed the ID check: a 10-minute signed URL, only
 * with a valid session cookie for this exact link. Read-only view of the ORIGINAL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const resolved = await resolveToken(db, token);
  const notFound = new NextResponse("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  if (!resolved || !resolved.doc.original_pdf_path) return notFound;

  const session = openSession((await cookies()).get(cookieNames(resolved.tokenHash).session)?.value, resolved.tokenHash);
  const valid =
    session && (resolved.mode === "per_signer" ? session.s === resolved.signer.id && resolved.signer.status === "pending" : !!session.h);
  if (!valid) return notFound;

  const url = await fileStore().signedUrl("originals", resolved.doc.original_pdf_path, 10 * 60);
  return NextResponse.json({ url }, { headers: { "cache-control": "no-store" } });
}
