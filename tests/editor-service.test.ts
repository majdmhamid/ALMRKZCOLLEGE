/** Placement saving rules on PGlite: who can be placed, where, and the audit trail. */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { samplePdf, sampleSignaturePng } from "@/features/signing/server/db/seed";
import { listPlacements } from "@/features/signing/server/repo/placements";
import { completeDocument, startUpload } from "@/features/signing/server/services/documents";
import { loadEditor, savePlacements } from "@/features/signing/server/services/editor";
import { getShareInfo } from "@/features/signing/server/services/links";
import { resolveToken, submitSignature, verifyId } from "@/features/signing/server/services/signing";
import { fileStore, paths } from "@/features/signing/server/storage";
import { testBackend } from "./helpers";

let backend: Awaited<ReturnType<typeof testBackend>>;
beforeAll(async () => {
  backend = await testBackend();
});
afterAll(async () => backend?.cleanup());

/** A 3-page per-signer document where A signed and B didn't. */
async function docWithOneSignature() {
  const pdf = await samplePdf("Doc", 3);
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
  const resolved = await resolveToken(backend.db, info.links[0].url!.split("/sign/")[1]);
  const v = await verifyId(backend.db, resolved, { idNumber: "123456782" }, { ip: null, userAgent: null, deviceId: "d" });
  if (!v.ok) throw new Error(v.error);
  await submitSignature(backend.db, resolved, v.session, { method: "draw", png: await sampleSignaturePng(1), readConfirmed: true }, { ip: null, userAgent: null });
  return { id: started.documentId, signedId: info.links[0].signerId!, pendingId: info.links[1].signerId! };
}

const place = (signerId: string, over: Partial<{ page: number; x: number; y: number; width: number; height: number }> = {}) => ({
  id: randomUUID(),
  signer_id: signerId,
  page: 1,
  x: 0.1,
  y: 0.8,
  width: 0.3,
  height: 0.1,
  ...over,
});

describe("savePlacements", () => {
  it("saves, replaces and deletes; logs only when the set changes", async () => {
    const { id, signedId } = await docWithOneSignature();
    const a = place(signedId);
    const b = place(signedId, { page: 3 });
    expect(await savePlacements(backend.ctx, id, [a, b])).toMatchObject({ ok: true });
    expect(await listPlacements(backend.db, id)).toHaveLength(2);

    // Move only → no new "placed" event.
    expect(await savePlacements(backend.ctx, id, [{ ...a, x: 0.5 }, b])).toMatchObject({ ok: true });
    // Remove one → logged.
    expect(await savePlacements(backend.ctx, id, [{ ...a, x: 0.5 }])).toMatchObject({ ok: true });
    const rows = await listPlacements(backend.db, id);
    expect(rows).toEqual([expect.objectContaining({ id: a.id, x: 0.5, page: 1 })]);

    const events = await backend.db.query<{ n: number }>(
      `select count(*)::int as n from public.audit_events where document_id = $1 and event = 'placed'`,
      [id],
    );
    expect(events[0].n).toBe(2);

    const editor = await loadEditor(backend.ctx, id);
    expect(editor?.signatures.map((s) => [s.name, !!s.imageUrl])).toEqual([
      ["A", true],
      ["B", false],
    ]);
  });

  it("refuses unsigned signers, signers of other documents, bad pages and off-page boxes", async () => {
    const one = await docWithOneSignature();
    const other = await docWithOneSignature();
    expect(await savePlacements(backend.ctx, one.id, [place(one.pendingId)])).toMatchObject({ ok: false, error: "bad_signer" });
    expect(await savePlacements(backend.ctx, one.id, [place(other.signedId)])).toMatchObject({ ok: false, error: "bad_signer" });
    expect(await savePlacements(backend.ctx, one.id, [place(one.signedId, { page: 4 })])).toMatchObject({ ok: false, error: "bad_page" });
    expect(await savePlacements(backend.ctx, one.id, [place(one.signedId, { x: 0.8, width: 0.3 })])).toMatchObject({ ok: false, error: "invalid" });
    expect(await savePlacements(backend.ctx, one.id, "nope")).toMatchObject({ ok: false, error: "invalid" });
    expect(await listPlacements(backend.db, one.id)).toHaveLength(0);
  });

  it("is read-only once finalized", async () => {
    const { id, signedId } = await docWithOneSignature();
    await backend.db.query(
      `update public.documents set status = 'finalized', final_pdf_path = 'x/final.pdf', finalized_at = now() where id = $1`,
      [id],
    );
    expect(await savePlacements(backend.ctx, id, [place(signedId)])).toMatchObject({ ok: false, error: "finalized" });
  });
});
