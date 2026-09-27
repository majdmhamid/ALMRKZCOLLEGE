"use client";

import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

/**
 * pdf.js rendering. Pages are shown AS DISPLAYED by a PDF viewer: the page's
 * /Rotate and CropBox are applied by getViewport(), so overlay fractions (0–1)
 * relative to this box are exactly what the server converts back to PDF points.
 */

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
    return pdfjs;
  });
  return pdfjsPromise;
}

export type PdfState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; doc: PDFDocumentProxy; sizes: { width: number; height: number }[] };

/** Loads a PDF from a URL and measures every page. */
export function usePdfDocument(url: string | null): PdfState {
  const [state, setState] = useState<PdfState>({ status: "loading" });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let task: PDFDocumentLoadingTask | null = null;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        task = pdfjs.getDocument({
          url,
          // Copied into public/pdfjs by scripts/copy-pdf-worker.mjs.
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
        });
        const doc = await task.promise;
        const sizes = await Promise.all(
          Array.from({ length: doc.numPages }, async (_, i) => {
            const page = await doc.getPage(i + 1);
            const vp = page.getViewport({ scale: 1 });
            return { width: vp.width, height: vp.height };
          }),
        );
        if (!cancelled) setState({ status: "ready", doc, sizes });
      } catch (err) {
        console.error("PDF load failed", err);
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [url]);

  return state;
}

/**
 * One page at a given CSS width. Renders only when near the viewport; children
 * are laid over the page (position them with percentages).
 */
export function PdfPage({
  doc,
  pageNumber,
  width,
  size,
  children,
  className = "",
  eager = false,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  size: { width: number; height: number };
  children?: React.ReactNode;
  className?: string;
  eager?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(eager);
  const height = (width * size.height) / size.width;

  useEffect(() => {
    if (eager || !box.current) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { rootMargin: "600px 0px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!visible || !canvas.current || width <= 0) return;
    let task: RenderTask | null = null;
    let page: PDFPageProxy | null = null;
    let cancelled = false;
    (async () => {
      page = await doc.getPage(pageNumber);
      if (cancelled || !canvas.current) return;
      // Cap the pixel ratio: a full A4 page at 3× on a phone costs a lot of memory.
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: (width / size.width) * ratio });
      const el = canvas.current;
      el.width = Math.floor(viewport.width);
      el.height = Math.floor(viewport.height);
      task = page.render({ canvas: el, viewport });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, doc, pageNumber, width, size.width]);

  return (
    <div
      ref={box}
      data-page={pageNumber}
      className={`relative bg-white shadow-card ring-1 ring-slate-200 ${className}`}
      style={{ width, height }}
    >
      {/* dir=ltr: canvas text inherits CSS direction, and pdf.js glyph placement assumes LTR. */}
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full" aria-hidden />
      {children}
    </div>
  );
}

/** Tracks an element's content width (for fit-to-width rendering). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
