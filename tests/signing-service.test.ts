/**
 * The public signing flow on PGlite + mock storage: link resolution (the link is
 * the credential — no ID number), the shared link's name step, the signature
 * image checks, submit, and the admin's link controls (revoke / regenerate).
 */
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signingUrl } from "@/features/signing/lib/share";
import { samplePdf, sampleSignaturePng } from "@/features/signing/server/db/seed";
import { getDocumentRow } from "@/features/signing/server/repo/documents";
import { unreadCount } from "@/features/signing/server/repo/notifications";
import { completeDocument, startUpload } from "@/features/signing/server/services/documents";
import { getShareInfo, regenerateLink, revokeLink } from "@/features/signing/server/services/links";
import {
  canViewDocument,
  cleanSignaturePng,
  openSession,
  resolveToken,
  sealSession,
  signerNameSchema,
  startShared,
  submitSignature,
  viewFor,
} from "@/features/signing/server/services/signing";
import { fileStore, paths } from "@/features/signing/server/storage";
import { testBackend } from "./helpers";

let backend: Awaited<ReturnType<typeof testBackend>>;
let signature: Buffer;
const client = { ip: "10.9.8.7", userAgent: "phone" };

beforeAll(async () => {
  backend = await testBackend();
  signature = await sampleSignaturePng(3);
});
afterAll(async () => backend?.cleanup());

async function createDoc(opts: { mode: "per_signer" | "shared"; maxSigners?: number; adminSigns?: boolean; signers?: { name: string; phone?: string }[] }) {
  const pdf = await samplePdf("Doc", 2);
  const started = await startUpload(backend.ctx, { fileName: "doc.pdf", size: pdf.byteLength, linkMode: opts.mode });
  if (!started.ok) throw new Error(started.error);
  await fileStore().upload("originals", paths.original(started.documentId), pdf, "application/pdf");
  const done = await completeDocument(backend.ctx, {
    documentId: started.documentId,
    title: "Doc",
    linkMode: opts.mode,
    maxSigners: opts.maxSigners ?? null,
    adminSigns: opts.adminSigns ?? false,
    signers: opts.signers ?? [],
  });
  if (!done.ok) throw new Error(done.error);
  const info = await getShareInfo(backend.ctx, started.documentId);
  const tokens = info!.links.map((l) => l.url!.split("/sign/")[1]);
  return { id: started.documentId, tokens, info: info! };
}

const view = async (token: string, cookies: Parameters<typeof viewFor>[2] = {}) =>
  viewFor(backend.db, await resolveToken(backend.db, token), cookies);

describe("per-signer links", () => {
  it("builds share messages from the template and description", async () => {
    await backend.db.query(`update public.settings set message_template = 'שלום, מצורף מסמך לחתימה'`);
    const { info, tokens } = await createDoc({ mode: "per_signer", signers: [{ name: "Ahmad" }] });
    expect(info.links[0].url).toBe(signingUrl("http://localhost:3000", tokens[0]));
    expect(info.links[0].message).toBe(`שלום, מצורף מסמך לחתימה\n\n${info.links[0].url}`);
    await backend.db.query(`update public.settings set message_template = ''`);
  });

  it("stores no ID data and opens the document straight from the link", async () => {
    const { id, tokens } = await createDoc({ mode: "per_signer", signers: [{ name: "Ahmad", phone: "052-555-1234" }] });
    const [row] = await backend.db.query<{ id_number_hash: string | null; id_number_last3: string | null }>(
      `select id_number_hash, id_number_last3 from public.signers where document_id = $1`,
      [id],
    );
    expect(row).toEqual({ id_number_hash: null, id_number_last3: null });

    const resolved = await resolveToken(backend.db, tokens[0]);
    // No cookie needed: the personal link is the credential.
    expect(await view(tokens[0])).toMatchObject({ state: "sign", mode: "per_signer", signerName: "Ahmad", pageCount: 2 });
    expect(canViewDocument(resolved!, null)).toBe(true);
  });

  it("signs once; the second submit is refused and the first image stays", async () => {
    const { id, tokens } = await createDoc({
      mode: "per_signer",
      adminSigns: true,
      signers: [{ name: "A" }, { name: "B" }],
    });
    const resolved = await resolveToken(backend.db, tokens[0]);
    expect(await view(tokens[1])).toMatchObject({ state: "sign", signerName: "B" });

    const unreadBefore = await unreadCount(backend.db);
    const submit = (png: Uint8Array, readConfirmed = true) =>
      submitSignature(backend.db, resolved, null, { method: "draw", png, readConfirmed, esignConsent: true }, client);

    expect(await submit(signature, false)).toEqual({ ok: false, error: "invalid" });
    expect(await submitSignature(backend.db, resolved, null, { method: "typed", png: signature, readConfirmed: true }, client)).toEqual({
      ok: false,
      error: "method",
    });
    const first = await submit(signature);
    expect(first.ok).toBe(true);
    expect(await unreadCount(backend.db)).toBe(unreadBefore + 1);

    const [row] = await backend.db.query<{ signature_path: string; status: string; signed_ip: string; signed_user_agent: string }>(
      `select signature_path, status, signed_ip, signed_user_agent from public.signers where token_hash = $1`,
      [resolved!.tokenHash],
    );
    expect(row).toMatchObject({ status: "signed", signed_ip: "10.9.8.7", signed_user_agent: "phone" });
    const [signed] = await backend.db.query<{ details: Record<string, unknown>; ip: string; created_at: unknown }>(
      `select details, ip, created_at from public.audit_events where document_id = $1 and event = 'signed'`,
      [id],
    );
    expect(signed.details).toMatchObject({ method: "draw", link_mode: "per_signer", read_confirmed: true, esign_consent: true });
    expect(signed).toMatchObject({ ip: "10.9.8.7" });
    expect(signed.created_at).toBeTruthy();
    const stored = await fileStore().download("signatures", row.signature_path);

    expect(await submit(await sampleSignaturePng(9))).toEqual({ ok: false, error: "already_signed" });
    expect(Buffer.from(await fileStore().download("signatures", row.signature_path)).equals(Buffer.from(stored))).toBe(true);
    expect(await view(tokens[0])).toMatchObject({ state: "already_signed" });
    // Signed: the link no longer shows the PDF.
    expect(canViewDocument((await resolveToken(backend.db, tokens[0]))!, null)).toBe(false);

    // B and the admin are still missing.
    expect((await getDocumentRow(backend.db, id))?.status).toBe("pending");
  });

  it("a signer created with an ID number before the change (even locked) still signs by link alone", async () => {
    const { id, tokens } = await createDoc({ mode: "per_signer", signers: [{ name: "Old" }] });
    const HEX = "a".repeat(64);
    await backend.db.query(
      `update public.signers set id_number_hash = $2, id_number_last3 = '782', failed_attempts = 5, locked = true where document_id = $1`,
      [id, HEX],
    );
    expect(await view(tokens[0])).toMatchObject({ state: "sign", signerName: "Old" });
    const resolved = await resolveToken(backend.db, tokens[0]);
    expect(await submitSignature(backend.db, resolved, null, { method: "draw", png: signature, readConfirmed: true }, client)).toMatchObject({
      ok: true,
    });
    // The old data stays as it was.
    const [row] = await backend.db.query<{ id_number_hash: string; id_number_last3: string; status: string }>(
      `select id_number_hash, id_number_last3, status from public.signers where document_id = $1`,
      [id],
    );
    expect(row).toEqual({ id_number_hash: HEX, id_number_last3: "782", status: "signed" });
  });
});

describe("shared link", () => {
  it("validates the full name", () => {
    const ok = (v: string) => signerNameSchema.safeParse(v);
    expect(ok("  رنا   حسن ")).toMatchObject({ success: true, data: "رنا حسن" });
    expect(ok("סמר ג'בארין").success).toBe(true);
    expect(ok("ג׳מאל אגבאריה").success).toBe(true);
    expect(ok("Anne-Marie O'Neil").success).toBe(true);
    expect(ok("مُحَمَّد").success).toBe(true);
    for (const bad of ["", " ", "A", "123456782", "<script>", "a1", "-- x", "x".repeat(121)]) {
      expect(ok(bad).success, bad).toBe(false);
    }
  });

  it("asks only for a name, takes up to max signers, and allows the same name twice", async () => {
    const { id, tokens, info } = await createDoc({ mode: "shared", maxSigners: 3 });
    const token = tokens[0];
    const r = () => resolveToken(backend.db, token);

    expect(await view(token)).toMatchObject({ state: "name", mode: "shared", signerName: null });
    expect(canViewDocument((await r())!, null)).toBe(false);
    expect(await startShared(backend.db, await r(), { name: "" })).toEqual({ ok: false, error: "bad_name" });
    expect(await startShared(backend.db, await r(), { name: "123456782" })).toEqual({ ok: false, error: "bad_name" });
    // Without the name step, submitting is refused.
    expect(await submitSignature(backend.db, await r(), null, { method: "draw", png: signature, readConfirmed: true }, client)).toEqual({
      ok: false,
      error: "session",
    });

    const started = await startShared(backend.db, await r(), { name: "  Sami   Agbaria " });
    if (!started.ok) throw new Error(started.error);
    expect(started.session).toEqual({ t: (await r())!.tokenHash, n: "Sami Agbaria" });
    // The name cookie round-trips and is bound to this link.
    const cookie = sealSession(started.session);
    expect(openSession(cookie, "f".repeat(64))).toBeNull();
    expect(await view(token, { session: cookie })).toMatchObject({ state: "sign", mode: "shared", signerName: "Sami Agbaria" });
    expect(canViewDocument((await r())!, openSession(cookie, (await r())!.tokenHash))).toBe(true);

    const sign = async (name: string) => {
      const v = await startShared(backend.db, await r(), { name });
      if (!v.ok) return v;
      return submitSignature(backend.db, await r(), v.session, { method: "draw", png: signature, readConfirmed: true }, client);
    };
    expect(await sign("Sami Agbaria")).toMatchObject({ ok: true });
    // Two students can share a name: the same name signs again as its own row.
    expect(await sign("Sami Agbaria")).toMatchObject({ ok: true });

    // Both got past the name step before the last slot is taken: only one wins.
    const v1 = await startShared(backend.db, await r(), { name: "Rana" });
    const v2 = await startShared(backend.db, await r(), { name: "Hadi" });
    if (!v1.ok || !v2.ok) throw new Error("name step failed");
    const results = await Promise.all(
      [v1, v2].map(async (v) =>
        submitSignature(backend.db, await r(), v.session, { method: "draw", png: signature, readConfirmed: true }, client),
      ),
    );
    expect(results.filter((x) => x.ok)).toHaveLength(1);
    expect(results.filter((x) => !x.ok)).toEqual([{ ok: false, error: "closed" }]);

    expect((await getDocumentRow(backend.db, id))?.status).toBe("signed");
    expect(await view(token)).toMatchObject({ state: "closed" });
    expect(await startShared(backend.db, await r(), { name: "Late Comer" })).toEqual({ ok: false, error: "closed" });
    const rows = await backend.db.query<{ name: string; id_number_hash: string | null; signed_ip: string }>(
      `select name, id_number_hash, signed_ip from public.signers where document_id = $1 order by signed_at`,
      [id],
    );
    expect(rows).toHaveLength(3);
    expect(rows.every((x) => x.id_number_hash === null && x.signed_ip === "10.9.8.7")).toBe(true);
    expect(rows.filter((x) => x.name === "Sami Agbaria")).toHaveLength(2);
    expect(info.linkMode).toBe("shared");
  });

  it("a per-signer link can't be used for the name step", async () => {
    const { tokens } = await createDoc({ mode: "per_signer", signers: [{ name: "A" }] });
    expect(await startShared(backend.db, await resolveToken(backend.db, tokens[0]), { name: "Someone Else" })).toEqual({
      ok: false,
      error: "invalid_link",
    });
  });
});

describe("revoke and regenerate", () => {
  it("revoked links stop working; a new link works", async () => {
    const { id, tokens, info } = await createDoc({ mode: "per_signer", signers: [{ name: "A" }] });
    const ref = { documentId: id, signerId: info.links[0].signerId };
    expect(await revokeLink(backend.ctx, ref)).toEqual({ ok: true });
    expect(await resolveToken(backend.db, tokens[0])).toBeNull();
    expect((await getShareInfo(backend.ctx, id))!.links[0].url).toBeNull();

    expect(await regenerateLink(backend.ctx, ref)).toEqual({ ok: true });
    const fresh = (await getShareInfo(backend.ctx, id))!.links[0].url!.split("/sign/")[1];
    expect(fresh).not.toBe(tokens[0]);
    expect(await view(fresh)).toMatchObject({ state: "sign" });
    expect(await view(tokens[0])).toEqual({ state: "invalid" });
    expect(await view("not-a-token")).toEqual({ state: "invalid" });
  });
});

describe("signature image checks", () => {
  it("trims the transparent border and keeps alpha", async () => {
    const padded = await sharp({ create: { width: 900, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: signature, top: 200, left: 300 }])
      .png()
      .toBuffer();
    const cleaned = await cleanSignaturePng(padded);
    const meta = await sharp(cleaned).metadata();
    expect(meta.hasAlpha).toBe(true);
    expect(meta.width).toBeLessThan(420);
    expect(meta.height).toBeLessThan(180);
  });

  it("rejects blank, JPEG, and oversized images", async () => {
    const blank = await sharp({ create: { width: 400, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    await expect(cleanSignaturePng(blank)).rejects.toThrow("empty");
    const jpeg = await sharp(signature).flatten({ background: "#fff" }).jpeg().toBuffer();
    await expect(cleanSignaturePng(jpeg)).rejects.toThrow("not_png");
    await expect(cleanSignaturePng(new Uint8Array(600 * 1024))).rejects.toThrow("size");
  });
});
