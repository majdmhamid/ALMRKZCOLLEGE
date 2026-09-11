"use client";

/**
 * أداة الوصولية (נגישות) — نسخة أولية مبنية داخل الموقع.
 *
 * توفّر الآن: تكبير/تصغير الخط، تباين عالٍ، إبراز الروابط، إيقاف الحركة، ورابط لإعلان الوصولية.
 * الإعدادات تُحفظ في متصفح الزائر (localStorage).
 *
 * ⚠️ كيف نركّب أداة معتمدة لاحقاً (مطلوب قانونياً في إسرائيل — تكן 5568):
 *  1. نختار مزوّداً (مثلاً: Nagishli / EqualWeb / UserWay / Vee) ونأخذ منه سطر السكربت الخاص بالموقع.
 *  2. نضيف السكربت في src/app/[locale]/layout.tsx عبر مكوّن <Script strategy="afterInteractive"> من next/script.
 *  3. نحذف هذا المكوّن (أو نبقيه كاحتياط) ونحدّث صفحة /accessibility بتفاصيل مسؤول الوصولية.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dictionary } from "@content/i18n";
import { href, type Locale } from "@/lib/i18n";
import { AccessibilityIcon, XIcon } from "./Icons";

type Prefs = { text: 0 | 1 | 2; contrast: boolean; links: boolean; motion: boolean };
const KEY = "almrkz-a11y";
const defaults: Prefs = { text: 0, contrast: false, links: false, motion: false };

function load(): Prefs {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return { ...defaults, ...(JSON.parse(saved) as Partial<Prefs>) };
  } catch {
    /* لا شيء */
  }
  return defaults;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2 text-start text-sm font-bold ${active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line hover:bg-surface"}`}
    >
      {label}
    </button>
  );
}

function apply(p: Prefs) {
  const el = document.documentElement;
  el.classList.toggle("a11y-text-lg", p.text === 1);
  el.classList.toggle("a11y-text-xl", p.text === 2);
  el.classList.toggle("a11y-contrast", p.contrast);
  el.classList.toggle("a11y-links", p.links);
  el.classList.toggle("a11y-no-motion", p.motion);
}

export default function AccessibilityWidget({ locale, dict }: { locale: Locale; dict: Dictionary["accessibility"]["widget"] }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(() => (typeof window === "undefined" ? defaults : load()));

  // تطبيق الإعدادات على الصفحة (نظام خارجي = DOM)
  useEffect(() => {
    apply(prefs);
  }, [prefs]);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* لا شيء */
    }
  };

  // على الموبايل: لسان صغير في منتصف حافة الشاشة (لا يغطي الأزرار)؛ على الشاشات الكبيرة: زر دائري في الزاوية
  return (
    <div className="fixed end-0 top-1/2 z-50 -translate-y-1/2 lg:end-auto lg:start-5 lg:top-auto lg:bottom-5 lg:translate-y-0">
      {open && (
        <div role="dialog" aria-label={dict.title} className="absolute end-12 top-1/2 w-64 -translate-y-1/2 rounded-2xl border border-line bg-white p-4 shadow-lift lg:static lg:mb-3 lg:translate-y-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">{dict.title}</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label={dict.reset} className="rounded-md p-1 hover:bg-surface">
              <XIcon width={18} height={18} />
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => update({ text: Math.min(2, prefs.text + 1) as Prefs["text"] })} className="rounded-lg border border-line px-3 py-2 text-sm font-bold hover:bg-surface">
                {dict.biggerText}
              </button>
              <button type="button" onClick={() => update({ text: Math.max(0, prefs.text - 1) as Prefs["text"] })} className="rounded-lg border border-line px-3 py-2 text-sm font-bold hover:bg-surface">
                {dict.smallerText}
              </button>
            </div>
            <Toggle label={dict.contrast} active={prefs.contrast} onClick={() => update({ contrast: !prefs.contrast })} />
            <Toggle label={dict.links} active={prefs.links} onClick={() => update({ links: !prefs.links })} />
            <Toggle label={dict.motion} active={prefs.motion} onClick={() => update({ motion: !prefs.motion })} />
            <button type="button" onClick={() => update(defaults)} className="w-full rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface">
              {dict.reset}
            </button>
            <Link href={href(locale, "/accessibility")} className="block text-center text-sm font-bold text-brand-600 hover:underline">
              {dict.statement}
            </Link>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={dict.open}
        className="inline-flex h-11 w-10 items-center justify-center rounded-s-xl bg-brand-700 text-white shadow-lg transition hover:bg-brand-800 lg:h-12 lg:w-12 lg:rounded-full lg:hover:-translate-y-0.5"
      >
        <AccessibilityIcon />
      </button>
    </div>
  );
}
