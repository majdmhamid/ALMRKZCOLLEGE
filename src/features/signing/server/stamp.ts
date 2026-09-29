import "server-only";
import { degrees, PDFDocument, type PDFImage } from "pdf-lib";
import { containBox, fractionToDrawOptions, type Box } from "@/features/signing/lib/geometry";

export type StampPlacement = Box & { page: number; signerId: string };

/**
 * Draws each placement's signature PNG onto a copy of the ORIGINAL PDF and
 * returns the new file. Positions are fractions of the displayed page; the
 * page's /Rotate and CropBox are handled by fractionToDrawOptions. The image keeps
 * its proportions, centered in the box (like the editor's object-fit: contain), so a
 * box resized without "lock ratio" never stretches the signature in the final PDF.
 * pdf-lib wraps the existing page content in q/Q before drawing, so whatever
 * graphics state the original left behind can't shift the signatures.
 */
export async function stampSignatures(
  original: Uint8Array,
  placements: StampPlacement[],
  images: Map<string, Uint8Array>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { updateMetadata: false });
  const pages = pdf.getPages();
  const embedded = new Map<string, PDFImage>();

  for (const p of placements) {
    const page = pages[p.page - 1];
    if (!page) throw new Error(`placement on missing page ${p.page}`);
    let image = embedded.get(p.signerId);
    if (!image) {
      const png = images.get(p.signerId);
      if (!png) throw new Error(`missing signature image for ${p.signerId}`);
      image = await pdf.embedPng(png);
      embedded.set(p.signerId, image);
    }
    const geometry = { crop: page.getCropBox(), rotation: page.getRotation().angle };
    const opts = fractionToDrawOptions(geometry, containBox(geometry, p, image.width / image.height));
    page.drawImage(image, { x: opts.x, y: opts.y, width: opts.width, height: opts.height, rotate: degrees(opts.rotate) });
  }

  return pdf.save();
}
