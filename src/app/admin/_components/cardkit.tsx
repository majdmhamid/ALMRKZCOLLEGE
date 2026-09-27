"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Localized, Locale } from "@content/types";
import { RuleWarning } from "./fields";

/** أزرار البطاقة (سحب + حذف) — تظهر عند المرور */
export function CardTools({ handle, onDelete, extra }: { handle?: ReactNode; onDelete?: () => void; extra?: ReactNode }) {
  return (
    <div className="edit-tools absolute end-2 top-2 z-[4] flex items-center gap-1.5">
      {extra}
      {handle}
      {onDelete && (
        <button type="button" onClick={onDelete} title="احذف" aria-label="احذف" className="inline-flex items-center justify-center rounded-lg bg-white/95 p-1.5 text-ink-muted shadow-sm ring-1 ring-line hover:bg-red-50 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

/** خانة نص داخل البطاقة، بنفس خط وحجم نص الموقع */
export function InlineText({ value, onChange, placeholder, multiline = false, className = "", lang }: { value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean; className?: string; lang?: string }) {
  return (
    <>
      {multiline ? (
        <textarea className={`inline-edit ${className}`} rows={2} value={value} placeholder={placeholder} lang={lang} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`inline-edit ${className}`} value={value} placeholder={placeholder} lang={lang} onChange={(e) => onChange(e.target.value)} />
      )}
      <RuleWarning text={value} />
    </>
  );
}

/**
 * اختيار من قائمة داخل البطاقة: يظهر كنص عادي (يلتف مثل الموقع)، والقائمة الحقيقية شفافة فوقه.
 */
export function InlineSelect({ value, label, onChange, children, ariaLabel, className = "" }: { value: string; label: string; onChange: (v: string) => void; children: ReactNode; ariaLabel: string; className?: string }) {
  return (
    <span className={`inline-edit relative !inline cursor-pointer ${className}`}>
      {label}
      <ChevronDown size={14} aria-hidden="true" className="ms-0.5 inline-block align-middle opacity-60" />
      <select className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
        {children}
      </select>
    </span>
  );
}

/** سطر صغير تحت البطاقة لكتابة الاسم باللغة الثانية بدون تبديل المعاينة */
export function OtherLang({ locale, value, onChange, label }: { locale: Locale; value: Localized; onChange: (v: Localized) => void; label: string }) {
  const other: Locale = locale === "ar" ? "he" : "ar";
  const missing = !value[other]?.trim();
  return (
    <label className={`mt-2 flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${missing ? "border-amber-300 bg-amber-50" : "border-line bg-white/70"}`}>
      <span className={`shrink-0 font-extrabold ${missing ? "text-amber-800" : "text-ink-muted"}`}>{other === "he" ? "עברית" : "عربي"}</span>
      <input className="min-w-0 flex-1 bg-transparent py-0.5 text-sm font-bold outline-none placeholder:font-normal placeholder:text-amber-700/70" lang={other} value={value[other] ?? ""} placeholder={`${label} ب${other === "he" ? "العبري" : "العربي"}`} onChange={(e) => onChange({ ...value, [other]: e.target.value })} />
    </label>
  );
}

/** بطاقة «إضافة» بخط متقطع بنفس حجم البطاقات */
export function AddCard({ label, onClick, className = "" }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`add-card ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-brand">
        <Plus size={24} />
      </span>
      {label}
    </button>
  );
}

/** خلفية «هيك بتظهر على الموقع» حول شبكة البطاقات */
export function SiteSurface({ children, tone = "white", label = "هيك بتظهر على الموقع", className = "" }: { children: ReactNode; tone?: "white" | "surface"; label?: string; className?: string }) {
  return (
    <div className={`site-frame ${className}`}>
      <div className="site-frame-bar">
        <i />
        <i />
        <i />
        <span className="ms-2 font-bold">{label}</span>
      </div>
      <div className={`${tone === "surface" ? "bg-surface" : "bg-white"} p-4 sm:p-6 md:p-8`}>{children}</div>
    </div>
  );
}
