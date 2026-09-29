"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";

/**
 * Native <dialog> (focus trap, Esc, backdrop for free). Controlled by `open`.
 * On phones it becomes a bottom sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useTranslations("common");
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const width = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" }[size];

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl bg-card p-0 text-ink shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:rounded-2xl ${width}`}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-slate-100 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
