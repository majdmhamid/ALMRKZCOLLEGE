/**
 * The public signing flow on PGlite + mock storage: link resolution, the ID
 * check with its 5-attempt lockout, the signature image checks, submit, and
 * the admin's link controls (revoke / regenerate / reset).
 */
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signingUrl } from "@/lib/share";
import { samplePdf, sampleSignaturePng } from "@/server/db/seed";
import { getDocumentRow } from "@/server/repo/documents";
import { unreadCount } from "@/server/repo/notifications";
import { completeDocument, startUpload } from "@/server/services/documents";
import { getShareInfo, regenerateLink, resetLock, revokeLink } from "@/server/services/links";
import {
  cleanSignaturePng,
  newDeviceId,
  resolveToken,
  sealSession,
  openSession,
  submitSignature,
  verifyId,
  viewFor,
} from "@/server/services/signing";
import { fileStore, paths } from "@/server/storage";
import { testBackend } from "./helpers";

let backend: Awaited<ReturnType<typeof testBackend>>;
let signature: Buffer;
const client = { ip: "10.9.8.7", userAgent: "phone" };

beforeAll(async () => {
  backend = await testBackend();
  signature = await sampleSignaturePng(3);
});
afterAll(async () => backend?.cleanup());

async function createDoc(opts: { mode: "per_signer" | "shared"; maxSigners?: number; adminSigns?: boolean; signers?: { name: string; idNumber: string }[] }) {
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
    const { info, tokens } = await createDoc({ mode: "per_signer", signers: [{ name: "Ahmad", idNumber: "123456782" }] });
    expect(info.links[0].url).toBe(signingUrl("http://localhost:3100", tokens[0]));
    expect(info.links[0].message).toBe(`שלום, מצורף מסמך לחתימה\n\n${info.links[0].url}`);
    await backend.db.query(`update public.settings set message_template = ''`);
  });

  it("locks after 5 wrong IDs, ignores malformed ones, and the admin can reset", async () => {
    const { id, tokens, info } = await createDoc({ mode: "per_signer", signers: [{ name: "Ahmad", idNumber: "123456782" }] });
    const token = tokens[0];
    const r = () => resolveToken(backend.db, token);
    const device = { ...client, deviceId: newDeviceId() };

    expect(await view(token)).toMatchObject({ state: "verify", signerName: "Ahmad" });
    expect(await verifyId(backend.db, await r(), { idNumber: "123456789" }, device)).toMatchObject({ ok: false, error: "bad_id" });

    const wrong = "000000018"; // valid check digit, not this signer
    for (let left = 4; left >= 1; left--) {
      expect(await verifyId(backend.db, await r(), { idNumber: wrong }, device)).toEqual({ ok: false, error: "wrong_id", attemptsLeft: left });
    }
    expect(await verifyId(backend.db, await r(), { idNumber: wrong }, device)).toEqual({ ok: false, error: "locked" });
    // Even the right ID is refused while locked.
    expect(await verifyId(backend.db, await r(), { idNumber: "123456782" }, device)).toEqual({ ok: false, error: "locked" });
    expect(await view(token)).toMatchObject({ state: "locked" });

    expect(await resetLock(backend.ctx, { documentId: id, signerId: info.links[0].signerId })).toEqual({ ok: true });
    const ok = await verifyId(backend.db, await r(), { idNumber: "123-456-782" }, device);
    expect(ok.ok).toBe(true);

    const events = await backend.db.query<{ event: string }>(
      `select event from public.audit_events where document_id = $1 order by id`,
      [id],
    );
    expect(events.map((e) => e.event)).toEqual([
      "created",
      "id_failed",
      "id_failed",
      "id_failed",
      "id_failed",
      "id_locked",
      "link_reset",
      "id_verified",
    ]);
  });

  it("signs once; the second submit is refused and the first image stays", async () => {
    const { id, tokens } = await createDoc({
      mode: "per_signer",
      adminSigns: true,
      signers: [
        { name: "A", idNumber: "123456782" },
        { name: "B", idNumber: "000000018" },
      ],
    });
    const resolved = await resolveToken(backend.db, tokens[0]);
    const verified = await verifyId(backend.db, resolved, { idNumber: "123456782" }, { ...client, deviceId: "d" });
    if (!verified.ok) throw new Error(verified.error);

    // The cookie round-trips and is bound to this link.
    const cookie = sealSession(verified.session);
    expect(openSession(cookie, resolved!.tokenHash)).toMatchObject({ s: verified.session.s });
    expect(openSession(cookie, "f".repeat(64))).toBeNull();
    expect(await view(tokens[0], { session: cookie })).toMatchObject({ state: "sign", signerName: "A", pageCount: 2 });
    // Another signer's link doesn't accept A's session.
    expect(await view(tokens[1], { session: cookie })).toMatchObject({ state: "verify" });

    const unreadBefore = await unreadCount(backend.db);
    const submit = (png: Uint8Array, readConfirmed = true) =>
      submitSignature(backend.db, resolved, verified.session, { method: "draw", png, readConfirmed }, client);

    expect(await submit(signature, false)).toEqual({ ok: false, error: "invalid" });
    expect(await submitSignature(backend.db, resolved, verified.session, { method: "typed", png: signature, readConfirmed: true }, client)).toEqual({
      ok: false,
      error: "method",
    });
    const first = await submit(signature);
    expect(first.ok).toBe(true);
    expect(await unreadCount(backend.db)).toBe(unreadBefore + 1);

    const [row] = await backend.db.query<{ signature_path: string; status: string; signed_ip: string }>(
      `select signature_path, status, signed_ip from public.signers where token_hash = $1`,
      [resolved!.tokenHash],
    );
    expect(row).toMatchObject({ status: "signed", signed_ip: "10.9.8.7" });
    const stored = await fileStore().download("signatures", row.signature_path);

    expect(await submit(await sampleSignaturePng(9))).toEqual({ ok: false, error: "already_signed" });
    expect(Buffer.from(await fileStore().download("signatures", row.signature_path)).equals(Buffer.from(stored))).toBe(true);
    expect(await view(tokens[0], { session: cookie })).toMatchObject({ state: "already_signed" });

    // B and the admin are still missing.
    expect((await getDocumentRow(backend.db, id))?.status).toBe("pending");
  });
});

describe("shared link", () => {
  it("takes up to max signers, one signature per ID, locks one device only", async () => {
    const { id, tokens, info } = await createDoc({ mode: "shared", maxSigners: 2 });
    const token = tokens[0];
    const r = () => resolveToken(backend.db, token);
    const phoneA = { ...client, deviceId: newDeviceId() };
    const phoneB = { ...client, deviceId: newDeviceId() };

    expect(await view(token)).toMatchObject({ state: "verify", mode: "shared", signerName: null });
    expect(await verifyId(backend.db, await r(), { idNumber: "123456782", name: "" }, phoneA)).toMatchObject({ error: "invalid" });

    const sign = async (name: string, idNumber: string, device = phoneA) => {
      const v = await verifyId(backend.db, await r(), { idNumber, name }, device);
      if (!v.ok) return v;
      return submitSignature(backend.db, await r(), v.session, { method: "draw", png: signature, readConfirmed: true }, client);
    };

    expect(await sign("Sami Agbaria", "123456782")).toMatchObject({ ok: true });
    // Same ID again: refused, and it counts as a wrong attempt on that device.
    expect(await sign("Sami again", "123-456-782")).toMatchObject({ ok: false, error: "already_signed", attemptsLeft: 4 });

    // Phone B gets locked by 5 bad IDs; phone A is unaffected.
    for (let i = 0; i < 4; i++) await verifyId(backend.db, await r(), { idNumber: "111111111", name: "Guest Two" }, phoneB);
    expect(await verifyId(backend.db, await r(), { idNumber: "111111111", name: "Guest Two" }, phoneB)).toEqual({ ok: false, error: "locked" });
    expect(await view(token, { deviceId: phoneB.deviceId })).toMatchObject({ state: "locked" });
    expect(await view(token, { deviceId: phoneA.deviceId })).toMatchObject({ state: "verify" });

    // Both sessions verified before the last slot is taken: only one wins.
    const v1 = await verifyId(backend.db, await r(), { idNumber: "000000018", name: "Rana" }, phoneA);
    const v2 = await verifyId(backend.db, await r(), { idNumber: "039337423", name: "Hadi" }, phoneA);
    if (!v1.ok || !v2.ok) throw new Error("verify failed");
    const results = await Promise.all(
      [v1, v2].map(async (v) =>
        submitSignature(backend.db, await r(), v.session, { method: "draw", png: signature, readConfirmed: true }, client),
      ),
    );
    expect(results.filter((x) => x.ok)).toHaveLength(1);
    expect(results.filter((x) => !x.ok)).toEqual([{ ok: false, error: "closed" }]);

    expect((await getDocumentRow(backend.db, id))?.status).toBe("signed");
    expect(await view(token)).toMatchObject({ state: "closed" });
    const [{ n }] = await backend.db.query<{ n: number }>(`select count(*)::int as n from public.signers where document_id = $1`, [id]);
    expect(n).toBe(2);

    // Admin reset clears every locked device on the link.
    expect(await resetLock(backend.ctx, { documentId: id, signerId: null })).toEqual({ ok: true });
    expect(info.linkMode).toBe("shared");
  });
});

describe("revoke and regenerate", () => {
  it("revoked links stop working; a new link works", async () => {
    const { id, tokens, info } = await createDoc({ mode: "per_signer", signers: [{ name: "A", idNumber: "123456782" }] });
    const ref = { documentId: id, signerId: info.links[0].signerId };
    expect(await revokeLink(backend.ctx, ref)).toEqual({ ok: true });
    expect(await resolveToken(backend.db, tokens[0])).toBeNull();
    expect((await getShareInfo(backend.ctx, id))!.links[0].url).toBeNull();

    expect(await regenerateLink(backend.ctx, ref)).toEqual({ ok: true });
    const fresh = (await getShareInfo(backend.ctx, id))!.links[0].url!.split("/sign/")[1];
    expect(fresh).not.toBe(tokens[0]);
    expect(await view(fresh)).toMatchObject({ state: "verify" });
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
