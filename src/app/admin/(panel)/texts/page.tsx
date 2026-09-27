"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale } from "@content/types";
import { PageIntro } from "../../_components/bits";
import { RuleWarning } from "../../_components/fields";
import { useAdmin } from "../../_lib/store";

/** أسماء أقسام النصوص بلغة مفهومة، بترتيب ظهورها بالموقع */
const SECTIONS: Record<string, string> = {
  topbar: "الشريط العلوي",
  nav: "القائمة",
  hero: "الواجهة الأولى بالصفحة الرئيسية",
  stats: "الأرقام تحت الواجهة",
  trust: "شارات الثقة",
  home: "أقسام الصفحة الرئيسية",
  steps: "«كيف تبدأ معنا؟»",
  courses: "صفحة الدورات",
  course: "صفحة الدورة",
  form: "استمارة «سجّل اهتمامك»",
  about: "صفحة عن الكلية",
  graduates: "صفحة الخريجين",
  gallery: "صفحة الصور والفيديو",
  news: "صفحة الأخبار",
  employers: "صفحة للشركات والمشغّلين",
  contact: "صفحة اتصل بنا",
  footer: "التذييل (أسفل الصفحة)",
  common: "كلمات عامة (أزرار وتسميات)",
  accessibility: "الوصولية",
  notFound: "صفحة «مش موجودة»",
};

type Tree = Record<string, unknown>;

function leaves(obj: unknown, prefix: string, out: string[]) {
  if (typeof obj === "string") out.push(prefix);
  else if (Array.isArray(obj)) obj.forEach((v, i) => leaves(v, `${prefix}.${i}`, out));
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) leaves(v, prefix ? `${prefix}.${k}` : k, out);
}

const getAt = (obj: unknown, path: string): string => {
  let cur: unknown = obj;
  for (const p of path.split(".")) cur = cur == null ? undefined : (cur as Tree)[p];
  return typeof cur === "string" ? cur : "";
};

function setAt<T>(obj: T, path: string[], value: string): T {
  const [head, ...rest] = path;
  const src = (obj ?? {}) as Tree | unknown[];
  const copy: Tree | unknown[] = Array.isArray(src) ? [...src] : { ...src };
  (copy as Tree)[head] = rest.length ? setAt((src as Tree)[head], rest, value) : value;
  return copy as T;
}

export default function TextsEditor() {
  const { draft, published, update } = useAdmin();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>("hero");

  const paths = useMemo(() => {
    const out: string[] = [];
    leaves(draft.texts.ar, "", out);
    return out.filter((p) => !p.startsWith("langName") && !p.startsWith("otherLangName"));
  }, [draft.texts.ar]);

  const bySection = useMemo(() => {
    const m = new Map<string, string[]>();
    const query = q.trim();
    for (const p of paths) {
      if (query && !getAt(draft.texts.ar, p).includes(query) && !getAt(draft.texts.he, p).includes(query)) continue;
      const s = p.split(".")[0];
      if (!m.has(s)) m.set(s, []);
      m.get(s)!.push(p);
    }
    const order = Object.keys(SECTIONS);
    const rank = (s: string) => (order.includes(s) ? order.indexOf(s) : 999);
    return [...m.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [paths, q, draft.texts]);

  const setText = (l: Locale, path: string, value: string) => update("texts", (prev) => ({ ...prev, [l]: setAt(prev[l], path.split("."), value) }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageIntro
        title="نصوص الموقع"
        text="كل الجمل الثابتة بالموقع: العناوين، الأزرار، نصوص الصفحات. مقسّمة حسب مكانها بالموقع. ابحث عن الجملة اللي بدك تغيّرها، أو افتح القسم."
      />
      <label className="card mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={20} className="text-ink-muted" />
        <input className="flex-1 bg-transparent text-lg outline-none" placeholder="ابحث عن جملة… مثلاً: اللي بإيدو صنعة" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <span className="text-sm font-bold text-ink-muted">{bySection.reduce((n, [, l]) => n + l.length, 0)} نتيجة</span>}
      </label>

      <div className="space-y-3">
        {bySection.map(([section, list]) => {
          const isOpen = !!q || open === section;
          const changed = list.filter((p) => getAt(draft.texts.ar, p) !== getAt(published.texts.ar, p) || getAt(draft.texts.he, p) !== getAt(published.texts.he, p)).length;
          return (
            <section key={section} className="card overflow-hidden">
              <button type="button" className="flex w-full items-center gap-3 px-5 py-4 text-start hover:bg-surface" onClick={() => setOpen(isOpen && !q ? null : section)} aria-expanded={isOpen}>
                <span className="flex-1 text-lg font-extrabold">{SECTIONS[section] ?? section}</span>
                {changed > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-900">{changed} معدّل</span>}
                <span className="text-sm text-ink-muted">{list.length} نص</span>
                <ChevronDown size={20} className={`text-ink-muted transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="divide-y divide-line border-t border-line">
                  {list.map((p) => {
                    const ar = getAt(draft.texts.ar, p);
                    const he = getAt(draft.texts.he, p);
                    const dirty = ar !== getAt(published.texts.ar, p) || he !== getAt(published.texts.he, p);
                    const long = Math.max(ar.length, he.length) > 70;
                    return (
                      <div key={p} className={`grid gap-3 px-5 py-4 sm:grid-cols-2 ${dirty ? "bg-amber-50/50" : ""}`}>
                        {(["ar", "he"] as const).map((l) => {
                          const v = l === "ar" ? ar : he;
                          return (
                            <div key={l} lang={l}>
                              <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-extrabold text-ink-muted">
                                <span className={`h-1.5 w-1.5 rounded-full ${l === "ar" ? "bg-brand-500" : "bg-sky-500"}`} /> {l === "ar" ? "عربي" : "עברית"}
                              </span>
                              {long ? (
                                <textarea className="input min-h-[4.5rem] py-2 text-[15px] leading-relaxed" rows={3} value={v} onChange={(e) => setText(l, p, e.target.value)} />
                              ) : (
                                <input className="input py-2 text-[15px]" value={v} onChange={(e) => setText(l, p, e.target.value)} />
                              )}
                              <RuleWarning text={v} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {!bySection.length && <p className="card p-6 text-center text-ink-muted">ما لقينا هاي الجملة.</p>}
      </div>
    </div>
  );
}
