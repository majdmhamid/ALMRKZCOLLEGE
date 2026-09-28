/**
 * Mock-mode sample data: an admin, documents in every state, sample PDFs and
 * signature images. Runs once (when the documents table is empty).
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { hashIdNumber, mintToken, sha256Hex } from "@/features/signing/lib/security/crypto";
import { idLast3 } from "@/features/signing/lib/security/israeli-id";
import { serverEnv } from "@/features/signing/lib/env";
import { MOCK_ADMIN_ID } from "@/features/signing/server/admin-id";
import { mockFilePath } from "@/features/signing/server/storage";
import type { Db } from "./types";

/** Appends the check digit to 8 digits → a valid (fake) Israeli ID. */
export function makeValidId(first8: string): string {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let n = Number(first8[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return first8 + String((10 - (sum % 10)) % 10);
}

/** A few pages that look like a contract; page 3 is landscape, page 4 has /Rotate 90. */
export async function samplePdf(title: string, pages = 2, opts: { landscape?: boolean; rotated?: boolean } = {}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const total = pages + (opts.landscape ? 1 : 0) + (opts.rotated ? 1 : 0);
  for (let i = 0; i < total; i++) {
    const landscape = opts.landscape && i === pages;
    const rotated = opts.rotated && i === total - 1 && !landscape;
    const page = pdf.addPage(landscape ? [842, 595] : [595, 842]);
    if (rotated) page.setRotation(degrees(90));
    const { width, height } = page.getSize();
    page.drawRectangle({ x: 40, y: height - 90, width: width - 80, height: 50, color: rgb(0.94, 0.95, 0.98) });
    page.drawText(title, { x: 56, y: height - 72, size: 16, font: bold, color: rgb(0.1, 0.12, 0.2) });
    page.drawText(`Page ${i + 1} of ${total}${rotated ? " (rotated 90)" : ""}${landscape ? " (landscape)" : ""}`, {
      x: width - 200,
      y: height - 72,
      size: 9,
      font,
      color: rgb(0.4, 0.45, 0.55),
    });
    for (let line = 0; line < 22; line++) {
      const y = height - 130 - line * 22;
      if (y < 190) break;
      const w = (width - 112) * (line % 5 === 4 ? 0.55 : 0.92 + (line % 3) * 0.02);
      page.drawRectangle({ x: 56, y, width: Math.min(w, width - 112), height: 6, color: rgb(0.85, 0.87, 0.9) });
    }
    if (i === total - 1 || i === 0) {
      for (const [n, x] of [
        [1, 56],
        [2, width / 2 + 20],
      ] as const) {
        page.drawLine({ start: { x, y: 120 }, end: { x: x + 180, y: 120 }, thickness: 1, color: rgb(0.3, 0.3, 0.35) });
        page.drawText(`Signature ${n}`, { x, y: 104, size: 9, font, color: rgb(0.4, 0.45, 0.55) });
      }
    }
  }
  return pdf.save();
}

/** A hand-drawn-looking signature PNG with a transparent background. */
export async function sampleSignaturePng(seed: number): Promise<Buffer> {
  const r = (n: number) => ((Math.sin(seed * 97 + n * 13) + 1) / 2) * 30 - 15;
  const d = `M 20 ${80 + r(1)} C 60 ${10 + r(2)}, 90 ${130 + r(3)}, 130 ${60 + r(4)} S 190 ${20 + r(5)}, 220 ${75 + r(6)}
    S 280 ${110 + r(7)}, 320 ${50 + r(8)} M 150 ${95 + r(9)} C 200 ${88 + r(10)}, 260 ${100 + r(11)}, 360 ${85 + r(12)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="140">
    <path d="${d}" fill="none" stroke="#1e3a8a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function put(bucket: string, objectPath: string, bytes: Uint8Array) {
  const file = mockFilePath(bucket, objectPath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

type SeedSigner = { name: string; id?: string; phone?: string; signed?: number; admin?: boolean };
type SeedDoc = {
  title: string;
  category: string;
  description?: string;
  daysAgo: number;
  mode: "per_signer" | "shared";
  maxSigners?: number;
  adminSigns?: boolean;
  signers: SeedSigner[];
  pages?: number;
  landscape?: boolean;
  rotated?: boolean;
  finalized?: boolean;
  inSigned?: boolean;
};

const DOCS: SeedDoc[] = [
  {
    title: "חוזה שכירות — דירה ברח' הזית",
    category: "חוזה",
    description: "חוזה שכירות לשנה. נא לקרוא ולחתום בתחתית כל עמוד.",
    daysAgo: 0,
    mode: "per_signer",
    adminSigns: true,
    pages: 3,
    landscape: true,
    rotated: true,
    signers: [
      { name: "אחמד מחאמיד", id: "03933742", phone: "0521234567", signed: 0.02 },
      { name: "סמר ג'בארין", id: "20456781", phone: "0539876543" },
    ],
  },
  {
    title: "ייפוי כוח — משפחת אגבאריה",
    category: "ייפוי כוח",
    daysAgo: 0.2,
    mode: "per_signer",
    signers: [{ name: "מוחמד אגבאריה", id: "31415926", phone: "0501112233" }],
  },
  {
    title: "טופס הרשמה — קורס ריתוך",
    category: "הרשמה",
    description: "טופס הרשמה לקורס ריתוך — מחזור אוקטובר.",
    daysAgo: 1,
    mode: "shared",
    maxSigners: 10,
    signers: [
      { name: "יוסף מחאמיד", id: "12312312", signed: 0.9 },
      { name: "עלי ג'בארין", id: "45645645", signed: 0.8 },
      { name: "ראמי אגבאריה", id: "78978978", signed: 0.5 },
    ],
  },
  {
    title: "הסכם שכר טרחה",
    category: "הסכם",
    daysAgo: 3,
    mode: "per_signer",
    adminSigns: true,
    signers: [
      { name: "נור חסן", id: "11122233", phone: "0547654321", signed: 2.5 },
      { name: "מנהל", admin: true, signed: 2.4 },
    ],
  },
  {
    title: "ראיה / מוצגים — תיק 4471",
    category: "ראיה / מוצגים",
    daysAgo: 5,
    mode: "per_signer",
    adminSigns: true,
    signers: [{ name: "חאלד עבד", id: "22233344" }],
  },
  {
    title: "הצהרת בריאות — סדנת בטיחות",
    category: "הצהרה",
    daysAgo: 12,
    mode: "shared",
    signers: [
      { name: "מאיסה מחאמיד", id: "33344455", signed: 11 },
      { name: "טארק אבו שקרה", id: "44455566", signed: 10.5 },
    ],
    finalized: true,
  },
  {
    title: "חוזה עבודה — מדריך חשמל",
    category: "חוזה",
    daysAgo: 34,
    mode: "per_signer",
    signers: [{ name: "ראאד מחאג'נה", id: "55566677", phone: "0523334444", signed: 33 }],
    finalized: true,
    inSigned: true,
  },
  {
    title: "ייפוי כוח — העברת רכב",
    category: "ייפוי כוח",
    daysAgo: 40,
    mode: "per_signer",
    signers: [{ name: "פאדי ג'בארין", id: "66677788", signed: 39 }],
    inSigned: true,
  },
];

export async function seedMockData(db: Db): Promise<void> {
  await db.query(`insert into auth.users (id, email) values ($1, $2) on conflict do nothing`, [
    MOCK_ADMIN_ID,
    process.env.MOCK_ADMIN_EMAIL || "admin@example.test",
  ]);
  await db.query(
    `insert into public.admin_profiles (user_id, display_name) values ($1, 'מנהל הדגמה') on conflict do nothing`,
    [MOCK_ADMIN_ID],
  );
  const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from public.documents`);
  if (n > 0) return;

  const env = serverEnv();
  const now = Date.now();
  const at = (daysAgo: number) => new Date(now - daysAgo * 86_400_000).toISOString();
  let sigSeed = 1;

  for (const spec of DOCS) {
    const id = randomUUID();
    const pdf = await samplePdf(spec.title.replace(/[^\x20-\x7e]/g, "").trim() || "Sample document", spec.pages ?? 2, spec);
    const originalPath = `${id}/original.pdf`;
    await put("originals", originalPath, pdf);
    const created = at(spec.daysAgo);
    const shared = spec.mode === "shared" ? mintToken(env.TOKEN_ENC_KEY) : null;
    const finalPath = spec.finalized ? `${id}/final-${now}.pdf` : null;
    if (finalPath) await put("finals", finalPath, pdf);

    await db.query(
      `insert into public.documents (id, title, category, description, file_name, original_pdf_path, original_sha256,
         original_size_bytes, page_count, link_mode, shared_token_hash, shared_token_enc, max_signers, admin_signs,
         status, final_pdf_path, final_sha256, final_size_bytes, finalized_at, in_signed_section, moved_to_signed_at,
         created_by, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$23,$15,$16,$17,$18,$19,$20,$21,$22,$22)`,
      [
        id,
        spec.title,
        spec.category,
        spec.description ?? null,
        `${spec.title}.pdf`,
        originalPath,
        sha256Hex(pdf),
        pdf.byteLength,
        (spec.pages ?? 2) + (spec.landscape ? 1 : 0) + (spec.rotated ? 1 : 0),
        spec.mode,
        shared?.hash ?? null,
        shared?.enc ?? null,
        spec.maxSigners ?? null,
        !!spec.adminSigns,
        finalPath,
        finalPath ? sha256Hex(pdf) : null,
        finalPath ? pdf.byteLength : null,
        finalPath ? at(spec.daysAgo - 0.5) : null,
        !!spec.inSigned,
        spec.inSigned ? at(spec.daysAgo - 1) : null,
        MOCK_ADMIN_ID,
        created,
        finalPath ? "finalized" : "pending",
      ],
    );

    const signers = [...spec.signers];
    if (spec.adminSigns && !signers.some((s) => s.admin)) signers.push({ name: "מנהל הדגמה", admin: true });
    for (const s of signers) {
      const signerId = randomUUID();
      const idNumber = s.id ? makeValidId(s.id) : null;
      const token = spec.mode === "per_signer" && !s.admin ? mintToken(env.TOKEN_ENC_KEY) : null;
      let signaturePath: string | null = null;
      if (s.signed !== undefined) {
        signaturePath = `${id}/${signerId}.png`;
        await put("signatures", signaturePath, await sampleSignaturePng(sigSeed++));
      }
      await db.query(
        `insert into public.signers (id, document_id, name, id_number_hash, id_number_last3, phone, token_hash, token_enc,
           is_admin, admin_user_id, status, signature_path, signature_method, signed_at, signed_ip, signed_user_agent, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          signerId,
          id,
          s.admin ? "מנהל הדגמה" : s.name,
          idNumber ? hashIdNumber(idNumber, env.ID_HMAC_SECRET) : null,
          idNumber ? idLast3(idNumber) : null,
          s.phone ? `972${s.phone.slice(1)}` : null,
          token?.hash ?? null,
          token?.enc ?? null,
          !!s.admin,
          s.admin ? MOCK_ADMIN_ID : null,
          s.signed !== undefined ? "signed" : "pending",
          signaturePath,
          s.signed !== undefined ? "draw" : null,
          s.signed !== undefined ? at(s.signed) : null,
          s.signed !== undefined && !s.admin ? "10.0.0.7" : null,
          s.signed !== undefined && !s.admin ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" : null,
          created,
        ],
      );
      if (s.signed !== undefined && !s.admin && s.signed < 1) {
        await db.query(`insert into public.notifications (document_id, signer_id, created_at) values ($1, $2, $3)`, [
          id,
          signerId,
          at(s.signed),
        ]);
      }
    }

    // Derive pending/signed from the signers, unless finalized.
    await db.query(
      `update public.documents d set status = case
          when d.final_pdf_path is not null then 'finalized'::document_status
          when (d.admin_signs and not exists (select 1 from public.signers s where s.document_id = d.id and s.is_admin and s.status = 'signed'))
            then 'pending'::document_status
          when d.link_mode = 'per_signer' and not exists (select 1 from public.signers s where s.document_id = d.id and not s.is_admin and s.status = 'pending')
            then 'signed'::document_status
          when d.link_mode = 'shared' and (select count(*) from public.signers s where s.document_id = d.id and not s.is_admin and s.status = 'signed') >= coalesce(d.max_signers, 1)
            then 'signed'::document_status
          else 'pending'::document_status end
        where d.id = $1`,
      [id],
    );
    await db.query(
      `insert into public.audit_events (document_id, event, actor_user_id, details, created_at) values ($1, 'created', $2, $3::text::jsonb, $4)`,
      [id, MOCK_ADMIN_ID, JSON.stringify({ sha256: sha256Hex(pdf), seeded: true }), created],
    );
  }
}
