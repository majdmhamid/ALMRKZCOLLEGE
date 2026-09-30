/**
 * The create-document flow end to end on PGlite + local mock storage:
 * start upload → file lands in storage → complete (validation, tokens, audit)
 * → edit → delete. No ID numbers anywhere.
 */
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serverEnv } from "@/features/signing/lib/env";
import { decryptToken, hashToken, sha256Hex } from "@/features/signing/lib/security/crypto";
import { documentStats, getDocumentItem, getDocumentRow, listDocuments } from "@/features/signing/server/repo/documents";
import { fileStore, paths } from "@/features/signing/server/storage";
import {
  completeDocument,
  deleteDocuments,
  discardDraft,
  editDetails,
  startUpload,
  type CompleteInput,
} from "@/features/signing/server/services/documents";
import { samplePdf } from "@/features/signing/server/db/seed";
import { testBackend } from "./helpers";

let backend: Awaited<ReturnType<typeof testBackend>>;
let pdf: Uint8Array;

beforeAll(async () => {
  backend = await testBackend();
  pdf = await samplePdf("Test agreement", 3);
});

afterAll(async () => {
  await backend?.cleanup();
});

async function uploadDraft(bytes: Uint8Array = pdf, name = "agreement.pdf") {
  const started = await startUpload(backend.ctx, { fileName: name, size: bytes.byteLength, linkMode: "per_signer" });
  if (!started.ok) throw new Error(started.error);
  expect(started.uploadUrl).toContain("/api/mock-storage?");
  await fileStore().upload("originals", paths.original(started.documentId), bytes, "application/pdf");
  return started.documentId;
}

const base = (documentId: string): CompleteInput => ({
  documentId,
  title: "Agreement",
  category: "חוזה",
  description: "Please sign",
  linkMode: "per_signer",
  adminSigns: false,
  signers: [{ name: "Signer One", phone: "052-555-1234" }],
});

describe("startUpload", () => {
  it("refuses non-PDF names and files over 50 MB", async () => {
    expect(await startUpload(backend.ctx, { fileName: "x.docx", size: 10, linkMode: "shared" })).toMatchObject({
      ok: false,
      error: "not_pdf",
    });
    expect(
      await startUpload(backend.ctx, { fileName: "x.pdf", size: 50 * 1024 * 1024 + 1, linkMode: "shared" }),
    ).toMatchObject({ ok: false, error: "too_large" });
  });

  it("creates a draft that can be discarded", async () => {
    const id = await uploadDraft();
    expect((await getDocumentRow(backend.db, id))?.status).toBe("draft");
    await discardDraft(backend.ctx, id);
    expect(await getDocumentRow(backend.db, id)).toBeNull();
    await expect(fileStore().download("originals", paths.original(id))).rejects.toThrow();
  });
});

describe("completeDocument", () => {
  it("validates signers before anything else", async () => {
    const id = await uploadDraft();
    expect(await completeDocument(backend.ctx, { ...base(id), signers: [{ name: " ", phone: "" }] })).toMatchObject({
      ok: false,
      error: "invalid",
    });
    expect(await completeDocument(backend.ctx, { ...base(id), signers: [] })).toMatchObject({ error: "no_signers" });
    expect(
      await completeDocument(backend.ctx, { ...base(id), signers: [{ name: "A" }, { name: "B", phone: "12" }] }),
    ).toMatchObject({ error: "bad_phone", index: 1 });
    expect((await getDocumentRow(backend.db, id))?.status).toBe("draft");
  });

  it("stores no ID data and mints decryptable per-signer links", async () => {
    const id = await uploadDraft();
    const result = await completeDocument(backend.ctx, { ...base(id), adminSigns: true });
    expect(result).toEqual({ ok: true, documentId: id });

    const doc = await getDocumentRow(backend.db, id);
    expect(doc).toMatchObject({ status: "pending", page_count: 3, original_sha256: sha256Hex(pdf), title: "Agreement" });

    const signers = await backend.db.query<Record<string, unknown>>(
      `select * from public.signers where document_id = $1 order by is_admin`,
      [id],
    );
    expect(signers).toHaveLength(2);
    const [client, admin] = signers;
    expect(client).toMatchObject({ name: "Signer One", id_number_hash: null, id_number_last3: null });
    expect(client.phone).toBe("972525551234");
    const token = decryptToken(client.token_enc as string, serverEnv().TOKEN_ENC_KEY);
    expect(hashToken(token)).toBe(client.token_hash);
    expect(admin).toMatchObject({ is_admin: true, token_hash: null, id_number_hash: null });

    const item = await getDocumentItem(backend.db, id);
    expect(JSON.stringify(item)).not.toMatch(/token|hash/);
    expect(item?.signers.map((s) => s.has_link)).toEqual([true, false]);

    const events = await backend.db.query<{ event: string; details: { sha256: string } }>(
      `select event, details from public.audit_events where document_id = $1`,
      [id],
    );
    expect(events).toEqual([expect.objectContaining({ event: "created", details: expect.objectContaining({ sha256: sha256Hex(pdf) }) })]);

    // Completing twice is refused.
    expect(await completeDocument(backend.ctx, base(id))).toMatchObject({ ok: false, error: "not_draft" });
  });

  it("shared mode gets one link and no pre-made signers", async () => {
    const id = await uploadDraft();
    const result = await completeDocument(backend.ctx, { ...base(id), linkMode: "shared", maxSigners: 5, signers: [] });
    expect(result.ok).toBe(true);
    const doc = await getDocumentRow(backend.db, id);
    expect(doc).toMatchObject({ link_mode: "shared", max_signers: 5 });
    expect(hashToken(decryptToken(doc!.shared_token_enc!, serverEnv().TOKEN_ENC_KEY))).toBe(doc!.shared_token_hash);
    const [{ n }] = await backend.db.query<{ n: number }>(`select count(*)::int as n from public.signers where document_id = $1`, [id]);
    expect(n).toBe(0);
  });

  it("rejects files that are not really PDFs, and encrypted PDFs", async () => {
    const fake = new TextEncoder().encode("hello, not a pdf at all");
    const id1 = await uploadDraft(fake, "fake.pdf");
    expect(await completeDocument(backend.ctx, base(id1))).toMatchObject({ ok: false, error: "not_pdf" });

    const broken = new TextEncoder().encode("%PDF-1.7\n this is not a real pdf body");
    const id2 = await uploadDraft(broken, "broken.pdf");
    expect(await completeDocument(backend.ctx, base(id2))).toMatchObject({ ok: false, error: "damaged" });

    // pdf-lib can't write encryption, so mark the trailer as encrypted by hand.
    const doc = await PDFDocument.load(pdf);
    doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: "Standard" });
    const id3 = await uploadDraft(await doc.save(), "locked.pdf");
    expect(await completeDocument(backend.ctx, base(id3))).toMatchObject({ ok: false, error: "encrypted" });
  });

  it("reports a missing upload", async () => {
    const started = await startUpload(backend.ctx, { fileName: "never.pdf", size: 100, linkMode: "per_signer" });
    if (!started.ok) throw new Error();
    expect(await completeDocument(backend.ctx, base(started.documentId))).toMatchObject({ ok: false, error: "file_missing" });
  });
});

describe("edit and delete", () => {
  it("edits details and soft-deletes (hidden from list and stats)", async () => {
    const id = await uploadDraft();
    await completeDocument(backend.ctx, base(id));
    expect(await editDetails(backend.ctx, { documentId: id, title: "  Renamed  ", category: "", description: null })).toEqual({
      ok: true,
    });
    expect(await getDocumentRow(backend.db, id)).toMatchObject({ title: "Renamed", category: null });

    const before = await documentStats(backend.db);
    expect(await deleteDocuments(backend.ctx, [id])).toEqual({ ok: true, deleted: 1 });
    expect((await listDocuments(backend.db, "active")).some((d) => d.id === id)).toBe(false);
    expect((await documentStats(backend.db)).total).toBe(before.total - 1);
    // The row still exists for the audit trail.
    const [row] = await backend.db.query<{ deleted_at: string | null }>(`select deleted_at from public.documents where id = $1`, [id]);
    expect(row.deleted_at).not.toBeNull();
    expect(await deleteDocuments(backend.ctx, ["not-a-uuid"])).toMatchObject({ ok: false });
  });
});
