import "server-only";
import { PDFDocument } from "pdf-lib";
import { sha256Hex } from "@/features/signing/lib/security/crypto";
import { MAX_UPLOAD_BYTES } from "@/features/signing/lib/domain";

export type PdfProblem = "not_pdf" | "too_large" | "encrypted" | "damaged" | "empty";

export class PdfError extends Error {
  constructor(public readonly problem: PdfProblem) {
    super(problem);
  }
}

/** Validates an uploaded PDF and returns what we record about it. */
export async function inspectPdf(bytes: Uint8Array): Promise<{ pageCount: number; sha256: string; size: number }> {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new PdfError("too_large");
  // "%PDF-" may be preceded by a little junk; the spec allows it within the first 1 KB.
  const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
  if (!head.includes("%PDF-")) throw new PdfError("not_pdf");

  let pageCount: number;
  try {
    const doc: PDFDocument = await PDFDocument.load(bytes, { updateMetadata: false });
    // pdf-lib is lenient on load; a missing page tree only shows up here.
    pageCount = doc.getPageCount();
  } catch (err) {
    if (err instanceof Error && /encrypt/i.test(err.message)) throw new PdfError("encrypted");
    throw new PdfError("damaged");
  }
  if (pageCount < 1) throw new PdfError("empty");
  return { pageCount, sha256: sha256Hex(bytes), size: bytes.byteLength };
}
