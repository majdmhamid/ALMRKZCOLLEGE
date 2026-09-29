import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminContext } from "@/features/signing/server/context";
import { getDocumentRow } from "@/features/signing/server/repo/documents";
import { fileStore } from "@/features/signing/server/storage";

/**
 * Admin view/download: checks the session, then redirects to a 60-second signed URL.
 * ?kind=original|final (default: final when it exists) &download=1 to save.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new NextResponse("Not found", { status: 404 });
  const { db } = await adminContext();
  const doc = await getDocumentRow(db, id);
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const kind = request.nextUrl.searchParams.get("kind");
  const useFinal = kind === "final" || (kind !== "original" && !!doc.final_pdf_path);
  const objectPath = useFinal ? doc.final_pdf_path : doc.original_pdf_path;
  if (!objectPath) return new NextResponse("Not found", { status: 404 });

  const safeTitle = doc.title.replace(/[\/:*?"<>|]+/g, " ").trim() || "document";
  const downloadName = request.nextUrl.searchParams.get("download") ? `${safeTitle}${useFinal ? " - موقّع" : ""}.pdf` : undefined;
  const url = await fileStore().signedUrl(useFinal ? "finals" : "originals", objectPath, 60, downloadName);
  return NextResponse.redirect(url, { headers: { "cache-control": "no-store" } });
}
