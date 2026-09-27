"use client";

import { AlertOctagon, ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Localized, LocalizedList } from "@content/types";
import { RULE_LABEL, checkText } from "@/lib/cms/rules";

const LANGS = [
  { l: "ar", label: "عربي" },
  { l: "he", label: "עברית" },
] as const;

/** تحذير فوري تحت الخانة إذا النص يخالف قواعد الكلية */
export function RuleWarning({ text }: { text: string | string[] | undefined }) {
  const all = Array.isArray(text) ? text : [text ?? ""];
  const rule = all.map((t) => checkText(t)).find(Boolean);
  if (!rule) return null;
  return (
    <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">
      <AlertOctagon size={14} className="mt-0.5 shrink-0" /> {RULE_LABEL[rule]}
    </p>
  );
}

export function FieldGroup({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-base font-extrabold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function LangLabel({ l, label }: { l: string; label: string }) {
  return (
    <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-extrabold text-ink-muted" lang={l}>
      <span className={`h-1.5 w-1.5 rounded-full ${l === "ar" ? "bg-brand-500" : "bg-sky-500"}`} /> {label}
    </span>
  );
}

/** نص بلغتين: عربي وعبري جنب بعض */
export function LocalizedField({ label, value, onChange, multiline = false, rows = 3, hint, placeholder }: { label: string; value: Localized | undefined; onChange: (v: Localized) => void; multiline?: boolean; rows?: number; hint?: ReactNode; placeholder?: Partial<Localized> }) {
  const v = value ?? { ar: "", he: "" };
  return (
    <div>
      <p className="label">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {LANGS.map(({ l, label: ll }) => (
          <div key={l} lang={l}>
            <LangLabel l={l} label={ll} />
            {multiline ? (
              <textarea className="input min-h-[5rem] leading-relaxed" rows={rows} value={v[l]} placeholder={placeholder?.[l]} onChange={(e) => onChange({ ...v, [l]: e.target.value })} />
            ) : (
              <input className="input" value={v[l]} placeholder={placeholder?.[l]} onChange={(e) => onChange({ ...v, [l]: e.target.value })} />
            )}
            {!v[l].trim() && v[l === "ar" ? "he" : "ar"].trim() && <p className="mt-1 text-xs font-bold text-amber-700">ناقص — {l === "he" ? "الصفحة العبرية رح تعرض النص العربي" : "اكتب النص العربي"}</p>}
            <RuleWarning text={v[l]} />
          </div>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** قائمة نقاط بلغتين (محتوى الدورة، الشروط، فقرات الخبر) */
export function LocalizedListField({ label, value, onChange, hint, addLabel = "أضف سطر", multiline = false }: { label: string; value: LocalizedList | undefined; onChange: (v: LocalizedList) => void; hint?: ReactNode; addLabel?: string; multiline?: boolean }) {
  const v = value ?? { ar: [], he: [] };
  const rows = Math.max(v.ar.length, v.he.length);
  const set = (l: "ar" | "he", i: number, text: string) => {
    const list = [...v[l]];
    while (list.length <= i) list.push("");
    list[i] = text;
    onChange({ ...v, [l]: list });
  };
  const remove = (i: number) => onChange({ ar: v.ar.filter((_, j) => j !== i), he: v.he.filter((_, j) => j !== i) });
  const move = (i: number, d: -1 | 1) => {
    const swap = (list: string[]) => {
      const out = [...list];
      while (out.length < rows) out.push("");
      [out[i], out[i + d]] = [out[i + d], out[i]];
      return out;
    };
    onChange({ ar: swap(v.ar), he: swap(v.he) });
  };
  return (
    <div>
      <p className="label">{label}</p>
      {hint && <p className="-mt-1 mb-2 text-xs text-ink-muted">{hint}</p>}
      <div className="mb-1 hidden grid-cols-[1fr_1fr_auto] gap-3 sm:grid">
        <LangLabel l="ar" label="عربي" />
        <LangLabel l="he" label="עברית" />
        <span className="w-[5.5rem]" />
      </div>
      <ol className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="grid items-start gap-2 rounded-xl border border-line bg-surface/50 p-2 sm:grid-cols-[1fr_1fr_auto] sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0">
            {(["ar", "he"] as const).map((l) =>
              multiline ? (
                <textarea key={l} lang={l} className="input min-h-[4.5rem] py-2 leading-relaxed" rows={3} value={v[l][i] ?? ""} onChange={(e) => set(l, i, e.target.value)} />
              ) : (
                <input key={l} lang={l} className="input py-2" value={v[l][i] ?? ""} onChange={(e) => set(l, i, e.target.value)} />
              ),
            )}
            <div className="flex items-center gap-0.5 pt-1.5">
              <IconBtn label="لفوق" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp size={16} />
              </IconBtn>
              <IconBtn label="لتحت" onClick={() => move(i, 1)} disabled={i === rows - 1}>
                <ArrowDown size={16} />
              </IconBtn>
              <IconBtn label="احذف" onClick={() => remove(i)} danger>
                <X size={16} />
              </IconBtn>
            </div>
            <div className="sm:col-span-2">
              <RuleWarning text={[v.ar[i] ?? "", v.he[i] ?? ""]} />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-50" onClick={() => onChange({ ar: [...v.ar, ""], he: [...v.he, ""] })}>
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}

export function IconBtn({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-1.5 transition disabled:opacity-25 ${danger ? "text-ink-muted hover:bg-red-50 hover:text-red-600" : "text-ink-muted hover:bg-brand-50 hover:text-brand-700"}`}
    >
      {children}
    </button>
  );
}

export function TextField({ label, value, onChange, hint, dir, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; dir?: "ltr" | "rtl"; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" type={type} dir={dir} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
      <RuleWarning text={value} />
    </label>
  );
}

export function NumberField({ label, value, onChange, suffix, min = 0 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="flex items-center gap-2">
        <input className="input w-32" type="number" inputMode="numeric" min={min} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} />
        {suffix && <span className="text-sm font-bold text-ink-soft">{suffix}</span>}
      </span>
    </label>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 transition hover:border-brand-300">
      <span className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-600" : "bg-line"}`}>
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "start-[1.375rem]" : "start-0.5"}`} />
      </span>
      <span>
        <span className="block font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function SelectField({ label, value, onChange, options, hint }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
