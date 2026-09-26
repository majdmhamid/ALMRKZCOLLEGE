"use client";

import { Eraser } from "lucide-react";
import SignaturePadLib from "signature_pad";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type SignaturePadHandle = {
  isEmpty: () => boolean;
  clear: () => void;
  /** PNG data URL with a transparent background (the server trims it). */
  toDataUrl: () => string | null;
};

/**
 * Finger/mouse signature box. Transparent background; keeps the drawing when
 * the phone rotates or the box resizes.
 */
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { onChange?: (empty: boolean) => void; hint: string; clearLabel: string; height?: number }
>(function SignaturePad({ onChange, hint, clearLabel, height = 200 }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const pad = new SignaturePadLib(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "#1e3a8a",
      minWidth: 1.2,
      maxWidth: 3.2,
      throttle: 8,
    });
    padRef.current = pad;
    pad.addEventListener("endStroke", () => onChangeRef.current?.(pad.isEmpty()));

    const resize = () => {
      const data = pad.toData();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width, height: h } = canvas.getBoundingClientRect();
      if (!width) return;
      // Scale stored points so a rotated phone keeps the same signature.
      const prevWidth = canvas.width / ratio || width;
      canvas.width = width * ratio;
      canvas.height = h * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);
      pad.clear();
      if (data.length && prevWidth) {
        const k = width / prevWidth;
        pad.fromData(data.map((g) => ({ ...g, points: g.points.map((p) => ({ ...p, x: p.x * k, y: p.y * k })) })));
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      pad.off();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    clear: () => {
      padRef.current?.clear();
      onChangeRef.current?.(true);
    },
    toDataUrl: () => (padRef.current && !padRef.current.isEmpty() ? padRef.current.toDataURL("image/png") : null),
  }));

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        data-testid="signature-canvas"
        style={{ height, touchAction: "none" }}
        className="block w-full cursor-crosshair rounded-2xl border-2 border-dashed border-slate-300 bg-white"
      />
      <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-slate-300" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted">{hint}</div>
      <button
        type="button"
        onClick={() => {
          padRef.current?.clear();
          onChangeRef.current?.(true);
        }}
        className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-ink"
      >
        <Eraser className="size-3.5" />
        {clearLabel}
      </button>
    </div>
  );
});

/** Renders text as a signature PNG (typed-name and checkbox methods). */
export function textSignatureDataUrl(text: string, opts: { check?: boolean; fontFamily: string }): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const size = 64;
  const font = `italic 600 ${size}px ${opts.fontFamily}`;
  ctx.font = font;
  const label = opts.check ? `☑ ${text}` : text;
  const width = Math.ceil(ctx.measureText(label).width) + 40;
  canvas.width = Math.min(Math.max(width, 200), 2400);
  canvas.height = size * 1.8;
  ctx.font = font;
  ctx.fillStyle = "#1e3a8a";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/png");
}
