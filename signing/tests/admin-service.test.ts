/** Blue pen (admin signs), the saved profile signature, and Settings — on PGlite. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { samplePdf, sampleSignaturePng } from "@/server/db/seed";
import { getDocumentRow } from "@/server/repo/documents";
import { getSettings } from "@/server/repo/settings";
import { adminSign, deleteProfileSignature, getSavedSignature, saveProfileSignature, saveSettings } from "@/server/services/admin";
import { completeDocument, startUpload } from "@/server/services/documents";
import { getShareInfo } from "@/server/services/links";
import { resolveToken, submitSignature, verifyId } from "@/server/services/signing";
import { fileStore, paths } from "@/server/storage";
import { testBackend } from "./helpers";

let backend: Awaited<ReturnType<typeof testBackend>>;
let dataUrl: string;
beforeAll(async () => {
  backend = await testBackend();
  dataUrl = `data:image/png;base64,${(await sampleSignaturePng(5)).toString("base64")}`;
});
afterAll(async () => backend?.cleanup());

async function doc(adminSigns: boolean, signers = [{ name: "A", idNumber: "123456782" }]) {
  const pdf = await samplePdf("Doc", 1);
  const started = await startUpload(backend.ctx, { fileName: "d.pdf", size: pdf.byteLength, linkMode: "per_signer" });
  if (!started.ok) throw new Error(started.error);
  await fileStore().upload("originals", paths.original(started.documentId), pdf, "application/pdf");
  await completeDocument(backend.ctx, { documentId: started.documentId, title: "Doc", linkMode: "per_signer", adminSigns, signers });
  return started.documentId;
}

describe("admin signs too", () => {
  it("draws, saves to the profile, and the next document reuses it", async () => {
    const first = await doc(true);
    expect(await getSavedSignature(backend.ctx)).toBeNull();
    expect(await adminSign(backend.ctx, { documentId: first, useSaved: true })).toEqual({ ok: false, error: "no_saved" });

    expect(await adminSign(backend.ctx, { documentId: first, useSaved: false, dataUrl, saveToProfile: true })).toEqual({ ok: true });
    const saved = await getSavedSignature(backend.ctx);
    expect(saved?.path).toMatch(/^admins\//);
    expect(await adminSign(backend.ctx, { documentId: first, useSaved: false, dataUrl })).toEqual({ ok: false, error: "already_signed" });

    const second = await doc(true);
    expect(await adminSign(backend.ctx, { documentId: second, useSaved: true })).toEqual({ ok: true });
    const [slot] = await backend.db.query<{ status: string; signature_path: string }>(
      `select status, signature_path from public.signers where document_id = $1 and is_admin`,
      [second],
    );
    expect(slot.status).toBe("signed");
    // The document gets its own copy, so deleting the profile signature later doesn't break it.
    expect(slot.signature_path.startsWith(`${second}/`)).toBe(true);
    await deleteProfileSignature(backend.ctx);
    expect(await getSavedSignature(backend.ctx)).toBeNull();
    expect((await fileStore().download("signatures", slot.signature_path)).byteLength).toBeGreaterThan(100);
  });

  it("updates the status: admin was the last one missing → signed", async () => {
    const id = await doc(true);
    const info = (await getShareInfo(backend.ctx, id))!;
    const resolved = await resolveToken(backend.db, info.links[0].url!.split("/sign/")[1]);
    const v = await verifyId(backend.db, resolved, { idNumber: "123456782" }, { ip: null, userAgent: null, deviceId: "d" });
    if (!v.ok) throw new Error(v.error);
    await submitSignature(backend.db, resolved, v.session, { method: "draw", png: await sampleSignaturePng(2), readConfirmed: true }, { ip: null, userAgent: null });
    expect((await getDocumentRow(backend.db, id))!.status).toBe("pending");
    await adminSign(backend.ctx, { documentId: id, useSaved: false, dataUrl });
    expect((await getDocumentRow(backend.db, id))!.status).toBe("signed");
  });

  it("refuses documents that don't ask for the admin, and blank drawings", async () => {
    const id = await doc(false);
    expect(await adminSign(backend.ctx, { documentId: id, useSaved: false, dataUrl })).toEqual({ ok: false, error: "not_required" });
    const blank = "data:image/png;base64," + Buffer.from(
      await (await import("sharp")).default({ create: { width: 300, height: 100, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer(),
    ).toString("base64");
    const needs = await doc(true);
    expect(await adminSign(backend.ctx, { documentId: needs, useSaved: false, dataUrl: blank })).toEqual({ ok: false, error: "image" });
    expect(await saveProfileSignature(backend.ctx, blank)).toEqual({ ok: false, error: "image" });
  });
});

describe("settings", () => {
  it("saves and controls which signature methods clients may use", async () => {
    expect(await saveSettings(backend.ctx, {
      allow_typed_signature: true,
      allow_checkbox_signature: false,
      default_link_mode: "shared",
      message_template: "  שלום,\r\nמצורף מסמך  ",
    })).toEqual({ ok: true });
    expect(await getSettings(backend.db)).toEqual({
      allow_typed_signature: true,
      allow_checkbox_signature: false,
      default_link_mode: "shared",
      message_template: "שלום,\nמצורף מסמך",
    });

    const id = await doc(false);
    const info = (await getShareInfo(backend.ctx, id))!;
    expect(info.links[0].message?.startsWith("שלום,\nמצורף מסמך\n\n")).toBe(true);
    const resolved = await resolveToken(backend.db, info.links[0].url!.split("/sign/")[1]);
    const v = await verifyId(backend.db, resolved, { idNumber: "123456782" }, { ip: null, userAgent: null, deviceId: "d" });
    if (!v.ok) throw new Error(v.error);
    const png = await sampleSignaturePng(7);
    expect(await submitSignature(backend.db, resolved, v.session, { method: "checkbox", png, readConfirmed: true }, { ip: null, userAgent: null })).toEqual({ ok: false, error: "method" });
    expect((await submitSignature(backend.db, resolved, v.session, { method: "typed", png, readConfirmed: true }, { ip: null, userAgent: null })).ok).toBe(true);

    expect(await saveSettings(backend.ctx, { allow_typed_signature: true, allow_checkbox_signature: false, default_link_mode: "nope" as never, message_template: "" })).toEqual({ ok: false, error: "invalid" });
  });
});
