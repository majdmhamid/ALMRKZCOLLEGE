"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  LockOpen,
  Maximize2,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { savePlacementsAction } from "@/app/admin/documents/actions";
import { PdfPage, useElementWidth, usePdfDocument } from "@/components/pdf/PdfView";
import { useFormatters } from "@/lib/format";
import type { EditorSignature } from "@/server/services/editor";
import type { Placement } from "@/server/repo/placements";

type SaveState = "idle" | "saving" | "saved" | "error";
type Drag = { signerId: string; imageUrl: string; aspect: number; x: number; y: number };

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_WIDTH_PX = 180;

/**
 * Placements are stored as fractions (0–1) of the page as displayed, so they
 * don't depend on zoom. Here fraction × rendered page size = pixels.
 */
export function PlacementEditor({
  documentId,
  signatures,
  initialPlacements,
  readOnly,
  onStatus,
}: {
  documentId: string;
  signatures: EditorSignature[];
  initialPlacements: Placement[];
  readOnly: boolean;
  /** Lets the page know whether everything is saved (Finalize waits for it). */
  onStatus?: (status: { saved: boolean; placements: number; unplaced: number }) => void;
}) {
  const t = useTranslations("editor");
  const fmt = useFormatters();
  const pdf = usePdfDocument(`/admin/documents/${documentId}/file?kind=original`);
  const [scrollRef, containerWidth] = useElementWidth<HTMLDivElement>();

  const [placements, setPlacements] = useState<Placement[]>(initialPlacements);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(ZOOMS.indexOf(1));
  const [lockRatio, setLockRatio] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [save, setSave] = useState<SaveState>("idle");
  const [drag, setDrag] = useState<Drag | null>(null);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const lastSaved = useRef(JSON.stringify(initialPlacements));

  const zoom = ZOOMS[zoomIndex];
  const pageWidth = Math.max(200, Math.floor((containerWidth - 48) * zoom));
  const signed = signatures.filter((s) => s.imageUrl);
  const bySigner = useMemo(() => new Map(signatures.map((s) => [s.signerId, s])), [signatures]);
  const countFor = (signerId: string) => placements.filter((p) => p.signer_id === signerId).length;
  const notPlaced = signed.filter((s) => countFor(s.signerId) === 0);

  useEffect(() => {
    onStatus?.({
      saved: JSON.stringify(placements) === lastSaved.current && save !== "saving",
      placements: placements.length,
      unplaced: notPlaced.length,
    });
  }, [placements, save, notPlaced.length, onStatus]);

  // ---------------------------------------------------------------- autosave
  // Save only real changes (also avoids a save on mount when effects run twice in dev).
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const json = JSON.stringify(placements);
    if (readOnly || json === lastSaved.current) return;
    setSave("saving");
    const handle = setTimeout(async function run() {
      const result = await savePlacementsAction(documentId, placements).catch(() => null);
      if (result?.ok) {
        lastSaved.current = json;
        setSave("saved");
      } else {
        setSave("error");
        retry.current = setTimeout(run, 3000);
      }
    }, 600);
    return () => {
      clearTimeout(handle);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [placements, documentId, readOnly]);

  // ------------------------------------------------------------ page tracking
  const onScroll = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;
    const mid = box.getBoundingClientRect().top + box.clientHeight / 3;
    let best = 1;
    for (const el of box.querySelectorAll<HTMLElement>("[data-page]")) {
      if (el.getBoundingClientRect().top <= mid) best = Number(el.dataset.page);
    }
    setCurrentPage(best);
  }, [scrollRef]);

  const goTo = (page: number) => {
    scrollRef.current?.querySelector(`[data-page="${page}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --------------------------------------------------------------- mutations
  const update = (id: string, patch: Partial<Placement>) =>
    setPlacements((all) => all.map((p) => (p.id === id ? clampPlacement({ ...p, ...patch }) : p)));
  const remove = useCallback((id: string) => {
    setPlacements((all) => all.filter((p) => p.id !== id));
    setSelected(null);
  }, []);

  const addPlacement = (signerId: string, page: number, centerX: number, centerY: number, pageSize: { w: number; h: number }) => {
    const aspect = aspects[signerId] || 2.6;
    const widthPx = Math.min(DEFAULT_WIDTH_PX * zoom, pageSize.w * 0.45);
    const width = widthPx / pageSize.w;
    const height = widthPx / aspect / pageSize.h;
    const p = clampPlacement({
      id: crypto.randomUUID(),
      signer_id: signerId,
      page,
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    });
    setPlacements((all) => [...all, p]);
    setSelected(p.id);
  };

  // Delete key removes the selected signature.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]");
      if (!typing && selected && !readOnly && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        remove(selected);
      }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, readOnly, remove]);

  // ------------------------------------------------- drag from the side panel
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    const up = (e: PointerEvent) => {
      const target = document
        .elementsFromPoint(e.clientX, e.clientY)
        .map((el) => (el as HTMLElement).closest<HTMLElement>("[data-page]"))
        .find(Boolean);
      if (target) {
        const rect = target.getBoundingClientRect();
        addPlacement(
          drag.signerId,
          Number(target.dataset.page),
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height,
          { w: rect.width, h: rect.height },
        );
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // addPlacement reads the latest zoom/aspects through the closure on drop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.signerId]);

  const addToCurrentPage = (signerId: string) => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-page="${currentPage}"]`);
    if (!el) return;
    addPlacement(signerId, currentPage, 0.5, 0.5, { w: el.offsetWidth, h: el.offsetHeight });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const total = pdf.status === "ready" ? pdf.sizes.length : 0;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:flex-row">
      {/* Pages */}
      <section className="flex min-h-[70dvh] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card lg:min-h-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-sm">
          <ToolButton label={t("prev")} disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>
            <ChevronUp className="size-4" />
          </ToolButton>
          <span className="min-w-24 text-center font-medium tabular-nums">
            {total ? t("page", { page: currentPage, total }) : "…"}
          </span>
          <ToolButton label={t("next")} disabled={currentPage >= total} onClick={() => goTo(currentPage + 1)}>
            <ChevronDown className="size-4" />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-line" />
          <ToolButton label={t("zoomOut")} disabled={zoomIndex === 0} onClick={() => setZoomIndex((z) => z - 1)}>
            <ZoomOut className="size-4" />
          </ToolButton>
          <span className="w-12 text-center tabular-nums" dir="ltr">
            {Math.round(zoom * 100)}%
          </span>
          <ToolButton label={t("zoomIn")} disabled={zoomIndex === ZOOMS.length - 1} onClick={() => setZoomIndex((z) => z + 1)}>
            <ZoomIn className="size-4" />
          </ToolButton>
          <ToolButton label={t("fit")} onClick={() => setZoomIndex(ZOOMS.indexOf(1))}>
            <Maximize2 className="size-4" />
          </ToolButton>
          {!readOnly && (
            <>
              <span className="mx-1 h-5 w-px bg-line" />
              <button
                type="button"
                aria-pressed={lockRatio}
                onClick={() => setLockRatio((l) => !l)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ${
                  lockRatio ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-slate-100"
                }`}
              >
                {lockRatio ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                {t("lockRatio")}
              </button>
            </>
          )}
          <span className="ms-auto text-xs text-muted" data-testid="save-state">
            {readOnly ? (
              <span className="inline-flex items-center gap-1 font-medium text-final">
                <Lock className="size-3.5" />
                {t("readOnly")}
              </span>
            ) : save === "saving" ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" />
                {t("saving")}
              </span>
            ) : save === "saved" ? (
              <span className="text-brand-700">✓ {t("saved")}</span>
            ) : save === "error" ? (
              <span className="text-red-600">{t("saveFailed")}</span>
            ) : null}
          </span>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          onPointerDown={(e) => {
            if (!(e.target as HTMLElement).closest(".placement-box")) setSelected(null);
          }}
          data-testid="editor-pages"
          className="min-h-0 flex-1 overflow-auto bg-slate-100 px-6 py-6"
        >
          {pdf.status === "error" ? (
            <p className="p-10 text-center text-sm text-red-600">{t("loadError")}</p>
          ) : pdf.status !== "ready" || !containerWidth ? (
            <p className="p-10 text-center text-sm text-muted">{t("loading")}</p>
          ) : (
            <div className="mx-auto flex w-max flex-col items-center gap-5">
              {pdf.sizes.map((size, i) => {
                const page = i + 1;
                const h = (pageWidth * size.height) / size.width;
                return (
                  <PdfPage key={page} doc={pdf.doc} pageNumber={page} size={size} width={pageWidth} eager={page <= 2}>
                    {/* LTR box: react-rnd positions with left/top. */}
                    <div dir="ltr" className="absolute inset-0">
                      {placements
                        .filter((p) => p.page === page)
                        .map((p) => {
                          const sig = bySigner.get(p.signer_id);
                          const isSelected = selected === p.id;
                          return (
                            <Rnd
                              key={p.id}
                              bounds="parent"
                              size={{ width: p.width * pageWidth, height: p.height * h }}
                              position={{ x: p.x * pageWidth, y: p.y * h }}
                              minWidth={16}
                              minHeight={8}
                              lockAspectRatio={lockRatio}
                              disableDragging={readOnly}
                              enableResizing={
                                !readOnly && isSelected
                                  ? { topLeft: true, topRight: true, bottomLeft: true, bottomRight: true, left: true, right: true, top: true, bottom: true }
                                  : false
                              }
                              resizeHandleComponent={
                                !readOnly && isSelected
                                  ? { topLeft: <Handle />, topRight: <Handle />, bottomLeft: <Handle />, bottomRight: <Handle /> }
                                  : undefined
                              }
                              onMouseDown={() => setSelected(p.id)}
                              onTouchStart={() => setSelected(p.id)}
                              onDragStop={(_e, d) => update(p.id, { x: d.x / pageWidth, y: d.y / h })}
                              onResizeStop={(_e, _dir, ref, _delta, pos) =>
                                update(p.id, {
                                  width: ref.offsetWidth / pageWidth,
                                  height: ref.offsetHeight / h,
                                  x: pos.x / pageWidth,
                                  y: pos.y / h,
                                })
                              }
                              className={`placement-box group ${readOnly ? "" : "cursor-move"} ${
                                isSelected ? "z-10 outline-2 outline-brand-500" : "outline-1 outline-dashed outline-brand-400/70 hover:outline-brand-500"
                              }`}
                            >
                              {sig?.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                                <img src={sig.imageUrl} alt={sig.name} draggable={false} className="pointer-events-none size-full object-contain" />
                              )}
                              {isSelected && (
                                <span className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white" dir="auto">
                                  {sig?.name}
                                </span>
                              )}
                              {isSelected && !readOnly && (
                                <button
                                  type="button"
                                  aria-label={t("remove")}
                                  title={t("remove")}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onClick={() => remove(p.id)}
                                  className="absolute -bottom-9 left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-red-600 text-white shadow ring-2 ring-white"
                                >
                                  <X className="size-3.5" />
                                </button>
                              )}
                            </Rnd>
                          );
                        })}
                    </div>
                  </PdfPage>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Signature panel — on the left (the end side in RTL) */}
      <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card lg:w-80">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-bold">{t("signatures")}</h2>
          {!readOnly && signed.length > 0 && <p className="mt-0.5 text-xs text-muted">{t("dragHint")}</p>}
        </div>
        {!readOnly && notPlaced.length > 0 && (
          <div data-testid="not-placed-warning" className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {t("notPlacedWarning", { n: notPlaced.length })}
          </div>
        )}
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {signatures.length === 0 && <li className="p-4 text-center text-sm text-muted">{t("noSignatures")}</li>}
          {signatures.map((s) => {
            const count = countFor(s.signerId);
            const canDrag = !readOnly && !!s.imageUrl;
            return (
              <li
                key={s.signerId}
                data-testid="signature-card"
                data-signer={s.signerId}
                className={`rounded-xl border p-2.5 ${
                  s.imageUrl ? (count === 0 && !readOnly ? "border-amber-300 bg-amber-50/40" : "border-line") : "border-dashed border-line opacity-70"
                }`}
              >
                <div
                  onPointerDown={(e) => {
                    if (!canDrag || e.button !== 0) return;
                    e.preventDefault();
                    setDrag({ signerId: s.signerId, imageUrl: s.imageUrl!, aspect: aspects[s.signerId] || 2.6, x: e.clientX, y: e.clientY });
                  }}
                  className={`grid h-20 place-items-center rounded-lg bg-[repeating-linear-gradient(45deg,#f8faf6,#f8faf6_8px,#fff_8px,#fff_16px)] ${
                    canDrag ? "cursor-grab touch-none active:cursor-grabbing" : ""
                  }`}
                >
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                    <img
                      src={s.imageUrl}
                      alt={s.name}
                      draggable={false}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setAspects((a) => ({ ...a, [s.signerId]: img.naturalWidth / img.naturalHeight }));
                        }
                      }}
                      className="pointer-events-none max-h-16 max-w-full select-none object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted">{t("notSigned")}</span>
                  )}
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {s.name}
                      {s.isAdmin && <span className="ms-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-admin">{t("admin")}</span>}
                    </div>
                    {s.signedAt && <div className="text-[11px] text-muted">{t("signedAt", { date: fmt.dateTime(s.signedAt) })}</div>}
                    {s.imageUrl && (
                      <div className={`text-[11px] font-medium ${count ? "text-brand-700" : "text-amber-700"}`}>
                        {t("placedCount", { n: count })}
                      </div>
                    )}
                  </div>
                  {canDrag && total > 0 && (
                    <button
                      type="button"
                      onClick={() => addToCurrentPage(s.signerId)}
                      title={t("addToPage", { page: currentPage })}
                      aria-label={t("addToPage", { page: currentPage })}
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-brand-700 hover:bg-brand-50"
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {drag && (
        // eslint-disable-next-line @next/next/no-img-element -- drag ghost
        <img
          src={drag.imageUrl}
          alt=""
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-80 drop-shadow-lg"
          style={{ left: drag.x, top: drag.y, width: DEFAULT_WIDTH_PX * zoom }}
        />
      )}
    </div>
  );
}

function clampPlacement(p: Placement): Placement {
  const width = Math.min(Math.max(p.width, 0.005), 1);
  const height = Math.min(Math.max(p.height, 0.005), 1);
  return {
    ...p,
    width,
    height,
    x: Math.min(Math.max(p.x, 0), 1 - width),
    y: Math.min(Math.max(p.y, 0), 1 - height),
  };
}

function Handle() {
  return <span className="block size-3 rounded-full border-2 border-white bg-brand-600 shadow" />;
}

function ToolButton({ label, children, ...rest }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
