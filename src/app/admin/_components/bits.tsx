"use client";

import { AlertTriangle, Check, CloudOff, Loader2, Undo2, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "../_lib/store";

/* ───────── تبديل لغة المعاينة ───────── */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useAdmin();
  return (
    <div className={`inline-flex rounded-xl border border-line bg-surface p-1 text-sm font-bold ${className}`} role="group" aria-label="لغة المعاينة" title="بأي لغة تعرض البطاقات">
      {(
        [
          ["ar", "عربي"],
          ["he", "עברית"],
        ] as const
      ).map(([l, label]) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-lg px-3 py-1.5 transition ${locale === l ? "bg-white text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"}`}
          lang={l}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ───────── حالة الحفظ ───────── */
export function SaveIndicator() {
  const { status, changes } = useAdmin();
  const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold";
  if (status === "saving" || status === "pending")
    return (
      <span className={`${base} bg-surface text-ink-muted`}>
        <Loader2 size={14} className="admin-spin" /> عم نحفظ…
      </span>
    );
  if (status === "error")
    return (
      <span className={`${base} bg-red-50 text-red-700`}>
        <CloudOff size={14} /> ما انحفظ — بنعيد المحاولة
      </span>
    );
  if (status === "conflict")
    return (
      <span className={`${base} bg-amber-50 text-amber-800`}>
        <AlertTriangle size={14} /> تعديل من مكان ثاني
      </span>
    );
  return (
    <span className={`${base} bg-brand-50 text-brand-800`}>
      <Check size={14} /> {changes.length ? "محفوظ كمسودة" : "كل شي منشور"}
    </span>
  );
}

/* ───────── رسائل صغيرة أسفل الشاشة ───────── */
export function Toasts() {
  const { toasts, dismissToast } = useAdmin();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`admin-pop pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-lift ${t.tone === "error" ? "bg-red-600 text-white" : "bg-ink text-white"}`}
        >
          {t.tone === "success" && <Check size={18} className="text-brand-300" />}
          <span className="flex-1">{t.message}</span>
          {t.undo && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 hover:bg-white/25"
              onClick={() => {
                t.undo?.();
                dismissToast(t.id);
              }}
            >
              <Undo2 size={15} /> تراجع
            </button>
          )}
          <button type="button" aria-label="إغلاق" className="opacity-60 hover:opacity-100" onClick={() => dismissToast(t.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ───────── نافذة منبثقة ───────── */
export function Dialog({ open, onClose, title, children, footer, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    // التركيز مرة وحدة عند الفتح: أول خانة كتابة، وإلا أول زر داخل المحتوى
    const body = ref.current?.querySelector<HTMLElement>("[data-dialog-body]");
    (body?.querySelector<HTMLElement>("input, textarea") ?? body?.querySelector<HTMLElement>("button") ?? ref.current)?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  // على مستوى الصفحة (مش داخل الشريط العلوي) حتى تظهر بالنص
  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" aria-label="إغلاق" onClick={onClose} tabIndex={-1} />
      <div ref={ref} tabIndex={-1} className={`admin-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift outline-none sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="flex items-center gap-3 border-b border-line px-6 py-4">
          <h2 className="flex-1 text-lg font-extrabold">{title}</h2>
          <button type="button" className="rounded-lg p-1.5 text-ink-muted hover:bg-surface" aria-label="إغلاق" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div data-dialog-body className="overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ───────── شارة «جديد / معدّل» على البطاقة ───────── */
export function StatusBadge({ status }: { status: "new" | "changed" | null }) {
  if (!status) return null;
  return (
    <span
      className={`pointer-events-none absolute start-2 top-2 z-[3] rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${status === "new" ? "bg-brand-600 text-white" : "bg-amber-400 text-amber-950"}`}
      title="هذا التعديل لسا ما انتشر على الموقع"
    >
      {status === "new" ? "جديد" : "معدّل"}
    </span>
  );
}

/* ───────── عنوان صفحة داخل اللوحة ───────── */
export function PageIntro({ title, text, actions }: { title: string; text?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="h2">{title}</h1>
        <span className="heading-bar" aria-hidden="true" />
        {text && <p className="mt-3 leading-relaxed text-ink-soft">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** ملاحظة صغيرة للغة الناقصة */
export function MissingLang({ lang }: { lang: "ar" | "he" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-900">
      <AlertTriangle size={12} /> ناقص {lang === "he" ? "عبري" : "عربي"}
    </span>
  );
}
