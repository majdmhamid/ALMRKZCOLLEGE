/**
 * Placement geometry.
 *
 * The editor stores boxes as fractions (0–1) of the page AS DISPLAYED — after
 * the page's /Rotate is applied and cropped to its CropBox — with the origin at
 * the top-left. PDF drawing happens in the page's unrotated user space, origin
 * bottom-left, in points. These helpers convert between the two.
 */

export type Box = { x: number; y: number; width: number; height: number };
export type PageGeometry = {
  /** CropBox in user space. */
  crop: { x: number; y: number; width: number; height: number };
  /** /Rotate, any multiple of 90 (normalized here). */
  rotation: number;
};

export function normalizeRotation(rotation: number): 0 | 90 | 180 | 270 {
  const r = (((Math.round(rotation / 90) * 90) % 360) + 360) % 360;
  return r as 0 | 90 | 180 | 270;
}

/** Size of the page as a viewer shows it (points). */
export function displaySize(page: PageGeometry): { width: number; height: number } {
  const r = normalizeRotation(page.rotation);
  return r === 90 || r === 270
    ? { width: page.crop.height, height: page.crop.width }
    : { width: page.crop.width, height: page.crop.height };
}

/** A displayed point (u right, v down, in points) → PDF user space. */
export function displayToPdf(page: PageGeometry, u: number, v: number): { x: number; y: number } {
  const { x: cx, y: cy, width: W, height: H } = page.crop;
  switch (normalizeRotation(page.rotation)) {
    case 0:
      return { x: cx + u, y: cy + H - v };
    case 90:
      return { x: cx + v, y: cy + u };
    case 180:
      return { x: cx + W - u, y: cy + v };
    case 270:
      return { x: cx + W - v, y: cy + H - u };
  }
}

/** PDF user space → displayed point (inverse of displayToPdf). */
export function pdfToDisplay(page: PageGeometry, x: number, y: number): { u: number; v: number } {
  const { x: cx, y: cy, width: W, height: H } = page.crop;
  const a = x - cx;
  const b = y - cy;
  switch (normalizeRotation(page.rotation)) {
    case 0:
      return { u: a, v: H - b };
    case 90:
      return { u: b, v: a };
    case 180:
      return { u: W - a, v: b };
    case 270:
      return { u: H - b, v: W - a };
  }
}

/**
 * Where to draw an image so it appears upright and fills `fraction` of the
 * displayed page: pdf-lib drawImage options (x, y, width, height, rotate°).
 * The anchor is the image's own bottom-left corner as the viewer sees it; the
 * rotation (counter-clockwise, like pdf-lib) undoes the page's /Rotate.
 */
export function fractionToDrawOptions(page: PageGeometry, fraction: Box) {
  const size = displaySize(page);
  const dx = fraction.x * size.width;
  const dy = fraction.y * size.height;
  const width = fraction.width * size.width;
  const height = fraction.height * size.height;
  const anchor = displayToPdf(page, dx, dy + height);
  return { x: anchor.x, y: anchor.y, width, height, rotate: normalizeRotation(page.rotation) };
}
