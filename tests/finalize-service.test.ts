/** Finalize / unlock / Signed section on PGlite + mock storage. */
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sha256Hex } from "@/features/signing/lib/security/crypto";
import { samplePdf, sampleSignaturePng } from "@/features/signing/server/db/seed";
import { getDocumentRow, listDocuments } from "@/features/signing/server/repo/documents";
import { completeDocument, startUpload } from "@/features/signing/server/services/documents";
import { savePlacements } from "@/features/signing/server/services/editor";
import { finalizeDocument, moveDocuments, unlockDocument } from "@/features/signing/server/services/finalize";
import { getShareInfo } from "@/features/signing/server/services/links";
import { resolveToken, submitSignature, verifyId } from "@/features/signing/server/services/signing";
import { fileStore, paths } from "@/features/signing/server/storage";
import { testBackend } from "./helpers";

let backend: Awaited<ReturnType<typeof testBackend>>;
beforeAll(async () => {
  backend = await testBackend();
});
afterAll(async () => backend?.cleanup());

async function signedDoc(opts: { signBoth?: boolean } = {}) {
  const pdf = await samplePdf("Doc", 2);
  const started = await startUpload(backend.ctx, { fileName: "d.pdf", size: pdf.byteLength, linkMode: "per_signer" });
  if (!started.ok) throw new Error(started.error);
  await fileStore().upload("originals", paths.original(started.documentId), pdf, "application/pdf");
  await completeDocument(backend.ctx, {
    documentId: started.documentId,
    title: "Doc",
    linkMode: "per_signer",
    adminSigns: false,
    signers: [
      { name: "A", idNumber: "123456782" },
      { name: "B", idNumber: "000000018" },
    ],
  });
  const info = (await getShareInfo(backend.ctx, started.documentId))!;
  const ids = ["123456782", "000000018"];
  const signerIds: string[] = [];
  for (let i = 0; i < (opts.signBoth === false ? 1 : 2); i++) {
    const resolved = await resolveToken(backend.db, info.links[i].url!.split("/sign/")[1]);
    const v = await verifyId(backend.db, resolved, { idNumber: ids[i] }, { ip: null, userAgent: null, deviceId: "d" });
    if (!v.ok) throw new Error(v.error);
    await submitSignature(backend.db, resolved, v.session, { method: "draw", png: await sampleSignaturePng(i), readConfirmed: true }, { ip: null, userAgent: null });
    signerIds.push(info.links[i].signerId!);
  }
  return { id: started.documentId, pdf, signerIds };
}

const box = (signerId: string, page = 1) => ({ id: randomUUID(), signer_id: signerId, page, x: 0.1, y: 0.8, width: 0.3, height: 0.08 });

describe("finalize", () => {
  it("refuses until everyone signed and something is placed", async () => {
    const half = await signedDoc({ signBoth: false });
    await savePlacements(backend.ctx, half.id, [box(half.signerIds[0])]);
    expect(await finalizeDocument(backend.ctx, half.id)).toEqual({ ok: false, error: "not_all_signed" });

    const full = await signedDoc();
    expect(await finalizeDocument(backend.ctx, full.id)).toEqual({ ok: false, error: "no_placements" });
  });

  it("stamps a NEW file, keeps the original, records both hashes, and locks editing", async () => {
    const { id, pdf, signerIds } = await signedDoc();
    await savePlacements(backend.ctx, id, [box(signerIds[0], 1), box(signerIds[0], 2), box(signerIds[1], 2)]);
    const result = await finalizeDocument(backend.ctx, id);
    if (!result.ok) throw new Error(result.error);

    const doc = (await getDocumentRow(backend.db, id))!;
    expect(doc).toMatchObject({ status: "finalized", final_sha256: result.sha256 });
    expect(doc.final_pdf_path).toMatch(/final-\d+\.pdf$/);

    const original = await fileStore().download("originals", doc.original_pdf_path!);
    expect(sha256Hex(original)).toBe(doc.original_sha256);
    expect(Buffer.from(original).equals(Buffer.from(pdf))).toBe(true);

    const final = await fileStore().download("finals", doc.final_pdf_path!);
    expect(sha256Hex(final)).toBe(result.sha256);
    const loaded = await PDFDocument.load(final);
    expect(loaded.getPageCount()).toBe(2);
    const images = loaded.context.enumerateIndirectObjects().filter(([, o]) => o.toString().includes("/Subtype /Image"));
    // One image per signer however many times placed, each with a soft mask = transparent background kept.
    const withMask = images.filter(([, o]) => o.toString().includes("/SMask"));
    expect(withMask).toHaveLength(2);
    expect(images).toHaveLength(4); // 2 images + their 2 masks

    const [event] = await backend.db.query<{ details: Record<string, unknown> }>(
      `select details from public.audit_events where document_id = $1 and event = 'finalized'`,
      [id],
    );
    expect(event.details).toMatchObject({ sha256: result.sha256, original_sha256: doc.original_sha256, placements: 3 });

    expect(await savePlacements(backend.ctx, id, [])).toMatchObject({ ok: false, error: "finalized" });
    expect(await finalizeDocument(backend.ctx, id)).toEqual({ ok: false, error: "already_final" });
  });

  it("refuses to stamp if the original file changed since upload", async () => {
    const { id, signerIds } = await signedDoc();
    await savePlacements(backend.ctx, id, [box(signerIds[0])]);
    await fileStore().upload("originals", paths.original(id), await samplePdf("Other", 2), "application/pdf");
    expect(await finalizeDocument(backend.ctx, id)).toEqual({ ok: false, error: "tampered" });
  });

  it("unlock discards the final PDF, reopens the editor, and is logged", async () => {
    const { id, signerIds } = await signedDoc();
    await savePlacements(backend.ctx, id, [box(signerIds[0])]);
    await finalizeDocument(backend.ctx, id);
    const finalPath = (await getDocumentRow(backend.db, id))!.final_pdf_path!;

    expect(await unlockDocument(backend.ctx, id)).toEqual({ ok: true });
    const doc = (await getDocumentRow(backend.db, id))!;
    expect(doc).toMatchObject({ status: "signed", final_pdf_path: null, final_sha256: null });
    await expect(fileStore().download("finals", finalPath)).rejects.toThrow();
    expect(await savePlacements(backend.ctx, id, [box(signerIds[1])])).toMatchObject({ ok: true });
    expect(await unlockDocument(backend.ctx, id)).toEqual({ ok: false, error: "not_final" });

    const events = await backend.db.query<{ event: string }>(
      `select event from public.audit_events where document_id = $1 and event in ('finalized', 'unlocked') order by id`,
      [id],
    );
    expect(events.map((e) => e.event)).toEqual(["finalized", "unlocked"]);
  });
});

describe("Signed section", () => {
  it("moves only signed/finalized documents, by hand, both ways", async () => {
    const done = await signedDoc();
    const half = await signedDoc({ signBoth: false });
    expect(await moveDocuments(backend.ctx, [done.id, half.id], true)).toEqual({ ok: true, moved: 1, skipped: 1 });

    const signed = await listDocuments(backend.db, "signed");
    expect(signed.map((d) => d.id)).toContain(done.id);
    expect(signed.map((d) => d.id)).not.toContain(half.id);
    expect((await getDocumentRow(backend.db, done.id))!.moved_to_signed_at).not.toBeNull();

    expect(await moveDocuments(backend.ctx, [done.id], false)).toEqual({ ok: true, moved: 1, skipped: 0 });
    expect((await listDocuments(backend.db, "active")).map((d) => d.id)).toContain(done.id);

    // Signing alone never moves a document.
    expect((await getDocumentRow(backend.db, half.id))!.in_signed_section).toBe(false);
  });
});
