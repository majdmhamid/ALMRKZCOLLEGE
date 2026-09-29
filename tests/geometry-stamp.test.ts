/**
 * Fraction ↔ PDF-point conversion and pdf-lib stamping, checked against pdf.js
 * itself: pdf.js's viewport (the same one the editor renders with) tells us
 * where each stamped image really lands on the displayed page.
 */
import { concatTransformationMatrix, degrees, PDFDocument } from "pdf-lib";
import { getDocument, OPS, type PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { containBox, displaySize, displayToPdf, fractionToDrawOptions, normalizeRotation, pdfToDisplay, type Box } from "@/features/signing/lib/geometry";
import { stampSignatures } from "@/features/signing/server/stamp";

const ROTATIONS = [0, 90, 180, 270] as const;
const CROP = { x: 40, y: 60, width: 500, height: 700 }; // offset CropBox inside a 612×842 MediaBox

describe("geometry", () => {
  it("normalizes rotations", () => {
    expect([0, 90, 180, 270, 360, -90, 450, -180].map(normalizeRotation)).toEqual([0, 90, 180, 270, 0, 270, 90, 180]);
  });

  it.each(ROTATIONS)("display ↔ PDF round-trips at /Rotate %i", (rotation) => {
    const page = { crop: CROP, rotation };
    const size = displaySize(page);
    for (const [u, v] of [
      [0, 0],
      [size.width, size.height],
      [123.4, 56.7],
    ]) {
      const p = displayToPdf(page, u, v);
      const back = pdfToDisplay(page, p.x, p.y);
      expect(back.u).toBeCloseTo(u, 6);
      expect(back.v).toBeCloseTo(v, 6);
    }
  });
});

/** Builds a PDF whose pages have an offset CropBox and each /Rotate value. */
async function testPdf() {
  const pdf = await PDFDocument.create();
  for (const rotation of ROTATIONS) {
    const page = pdf.addPage([612, 842]);
    page.setCropBox(CROP.x, CROP.y, CROP.width, CROP.height);
    page.setRotation(degrees(rotation));
    // Leave the graphics state dirty on purpose (a scale+move with no q/Q around it):
    // the stamp must not inherit it.
    page.pushOperators(concatTransformationMatrix(0.5, 0, 0, 0.5, 100, 100));
  }
  return pdf.save();
}

type Matrix = [number, number, number, number, number, number];
const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

/** Every painted image's box on the DISPLAYED page (via pdf.js's viewport), in points. */
async function paintedImageBoxes(page: PDFPageProxy): Promise<Box[]> {
  const viewport = page.getViewport({ scale: 1 });
  const ops = await page.getOperatorList();
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: Matrix[] = [];
  const boxes: Box[] = [];
  ops.fnArray.forEach((fn, i) => {
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = multiply(ctm, args as Matrix);
    else if (fn === OPS.paintImageXObject) {
      // The image fills the unit square in its own space.
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([a, b]) => viewport.convertToViewportPoint(ctm[0] * a + ctm[2] * b + ctm[4], ctm[1] * a + ctm[3] * b + ctm[5]));
      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      boxes.push({ x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) });
    }
  });
  return boxes;
}

describe("stampSignatures", () => {
  it("puts each signature exactly where the editor showed it, on every rotation", async () => {
    const original = await testPdf();
    const png = await sharp({ create: { width: 300, height: 100, channels: 4, background: { r: 30, g: 60, b: 140, alpha: 1 } } })
      .png()
      .toBuffer();
    const fraction: Box = { x: 0.1, y: 0.7, width: 0.35, height: 0.12 };
    const placements = ROTATIONS.map((_, i) => ({ ...fraction, page: i + 1, signerId: "s1" }));

    // Sanity: the original really leaves a 0.5 scale in effect (so this test would catch leakage).
    const origTask = getDocument({ data: new Uint8Array(original), useSystemFonts: false });
    const origOps = await (await (await origTask.promise).getPage(1)).getOperatorList();
    expect(origOps.argsArray.some((a, i) => origOps.fnArray[i] === OPS.transform && (a as number[])[0] === 0.5)).toBe(true);
    await origTask.destroy();

    const stamped = await stampSignatures(original, placements, new Map([["s1", png]]));
    expect(Buffer.from(stamped).equals(Buffer.from(original))).toBe(false);

    const task = getDocument({ data: new Uint8Array(stamped), useSystemFonts: false });
    const doc = await task.promise;
    expect(doc.numPages).toBe(4);
    for (let i = 0; i < 4; i++) {
      const page = await doc.getPage(i + 1);
      const viewport = page.getViewport({ scale: 1 });
      expect(page.rotate).toBe(ROTATIONS[i]);
      // pdf.js agrees with our idea of the displayed size (CropBox + rotation).
      const size = displaySize({ crop: CROP, rotation: ROTATIONS[i] });
      expect(viewport.width).toBeCloseTo(size.width, 3);
      expect(viewport.height).toBeCloseTo(size.height, 3);

      const [box] = await paintedImageBoxes(page);
      expect(box, `page ${i + 1}`).toBeDefined();
      // Fitted inside the box without stretching (the editor shows it with object-fit: contain).
      const want = containBox({ crop: CROP, rotation: ROTATIONS[i] }, fraction, 3);
      expect(box.x / viewport.width).toBeCloseTo(want.x, 4);
      expect(box.y / viewport.height).toBeCloseTo(want.y, 4);
      expect(box.width / viewport.width).toBeCloseTo(want.width, 4);
      expect(box.height / viewport.height).toBeCloseTo(want.height, 4);
      // Never stretched: the painted image keeps the PNG's 3:1 shape.
      expect(box.width / box.height).toBeCloseTo(3, 3);
      // …and stays inside the box the admin drew.
      expect(box.x / viewport.width).toBeGreaterThanOrEqual(fraction.x - 1e-6);
      expect(box.y / viewport.height).toBeGreaterThanOrEqual(fraction.y - 1e-6);
      expect((box.x + box.width) / viewport.width).toBeLessThanOrEqual(fraction.x + fraction.width + 1e-6);
      expect((box.y + box.height) / viewport.height).toBeLessThanOrEqual(fraction.y + fraction.height + 1e-6);
    }
    await task.destroy();
  });

  it("fits the image inside its box without stretching (object-fit: contain)", () => {
    const page = { crop: { x: 0, y: 0, width: 600, height: 800 }, rotation: 0 };
    // Box 300×80 pt, image 2:1 → 160×80 centered horizontally.
    const wide = containBox(page, { x: 0.1, y: 0.1, width: 0.5, height: 0.1 }, 2);
    expect(wide.width * 600).toBeCloseTo(160, 6);
    expect(wide.height).toBeCloseTo(0.1, 6);
    expect(wide.x * 600).toBeCloseTo(60 + 70, 6);
    // Box 120×400 pt, image 3:1 → 120×40 centered vertically.
    const tall = containBox(page, { x: 0, y: 0, width: 0.2, height: 0.5 }, 3);
    expect(tall.width).toBeCloseTo(0.2, 6);
    expect(tall.height * 800).toBeCloseTo(40, 6);
    expect(tall.y * 800).toBeCloseTo(180, 6);
  });

  it("keeps the image upright: its top edge is at the top on every rotation", () => {
    // For /Rotate 90 the draw rotation must undo the page rotation.
    const opts = fractionToDrawOptions({ crop: CROP, rotation: 90 }, { x: 0, y: 0, width: 0.5, height: 0.5 });
    expect(opts.rotate).toBe(90);
    // Anchor = the image's displayed bottom-left corner.
    const anchor = pdfToDisplay({ crop: CROP, rotation: 90 }, opts.x, opts.y);
    expect(anchor.u).toBeCloseTo(0, 6);
    expect(anchor.v).toBeCloseTo(displaySize({ crop: CROP, rotation: 90 }).height * 0.5, 6);
  });

  it("embeds one image per signer even when it is placed many times", async () => {
    const original = await testPdf();
    const png = await sharp({ create: { width: 50, height: 20, channels: 4, background: "#000" } }).png().toBuffer();
    const many = Array.from({ length: 6 }, (_, i) => ({ x: 0.1, y: 0.1 * i, width: 0.2, height: 0.05, page: 1, signerId: "s1" }));
    const stamped = await PDFDocument.load(await stampSignatures(original, many, new Map([["s1", png]])));
    const images = stamped.context
      .enumerateIndirectObjects()
      .filter(([, obj]) => obj.toString().includes("/Subtype /Image"));
    expect(images).toHaveLength(1);
  });

  it("fails loudly on a missing image or page", async () => {
    const original = await testPdf();
    await expect(stampSignatures(original, [{ x: 0, y: 0, width: 0.1, height: 0.1, page: 9, signerId: "s" }], new Map())).rejects.toThrow(/page 9/);
    await expect(stampSignatures(original, [{ x: 0, y: 0, width: 0.1, height: 0.1, page: 1, signerId: "s" }], new Map())).rejects.toThrow(/image/);
  });
});
