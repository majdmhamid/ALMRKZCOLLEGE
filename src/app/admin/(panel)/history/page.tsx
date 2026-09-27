"use client";

import { History, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { Release } from "@/lib/cms/schema";
import { listReleases, restoreRelease } from "../../actions";
import { Dialog, PageIntro } from "../../_components/bits";
import { useAdmin } from "../../_lib/store";

const fmt = (iso: string) => new Date(iso).toLocaleString("ar-EG-u-nu-latn", { dateStyle: "full", timeStyle: "short" });

export default function HistoryPage() {
  const { toast, flush, changes, publishedAt, reload } = useAdmin();
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [confirm, setConfirm] = useState<Release | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    listReleases().then(setReleases, () => setReleases([]));
  }, [publishedAt]);

  const restore = (r: Release) =>
    start(async () => {
      await flush();
      const res = await restoreRelease(r.id);
      if (res.ok) {
        toast({ tone: "success", message: "رجع الموقع للنسخة المختارة." });
        setConfirm(null);
        reload();
      } else toast({ tone: "error", message: "ما قدرنا نرجّع هاي النسخة." });
    });

  return (
    <div className="mx-auto max-w-4xl">
      <PageIntro title="سجل النشر" text="كل مرة بتضغط «نشر» بتنحفظ نسخة كاملة من الموقع هون. إذا صار إشي غلط، بتقدر ترجّع الموقع لأي نسخة قديمة بضغطة." />
      {releases === null ? (
        <p className="flex items-center gap-2 text-ink-muted">
          <Loader2 className="admin-spin" size={18} /> عم نحمّل…
        </p>
      ) : !releases.length ? (
        <div className="card p-8 text-center">
          <History size={32} className="mx-auto text-brand-400" />
          <p className="mt-3 font-bold">لسا ما انتشر إشي من لوحة التحكم.</p>
          <p className="mt-1 text-sm text-ink-muted">الموقع هلأ بيعرض المحتوى الأصلي. أول ما تنشر، بتظهر النسخ هون.</p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-s-2 border-brand-200 ps-6">
          {releases.map((r, i) => (
            <li key={r.id} className="relative">
              <span className={`absolute -start-[2.05rem] top-5 h-4 w-4 rounded-full ring-4 ring-surface ${i === 0 ? "bg-brand-600" : "bg-brand-300"}`} />
              <div className="card p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">
                      {fmt(r.createdAt)} {i === 0 && <span className="ms-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-800">النسخة الحالية على الموقع</span>}
                    </p>
                    {r.note && <p className="mt-1 text-ink-soft">{r.note}</p>}
                  </div>
                  {i > 0 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirm(r)}>
                      <RotateCcw size={16} /> رجّع الموقع لهاي النسخة
                    </button>
                  )}
                </div>
                {r.summary.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-bold text-brand-700">شو تغيّر ({r.summary.length})</summary>
                    <ul className="mt-2 list-disc space-y-1 ps-5 text-ink-soft">
                      {r.summary.slice(0, 30).map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="ترجيع نسخة قديمة"
        footer={
          <>
            <button type="button" className="btn btn-sm border border-line bg-white" onClick={() => setConfirm(null)} disabled={pending}>
              لا
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => confirm && restore(confirm)} disabled={pending}>
              <RotateCcw size={16} /> {pending ? "لحظة…" : "نعم، رجّعها"}
            </button>
          </>
        }
      >
        {confirm && (
          <div className="space-y-3">
            <p>
              الموقع رح يرجع مثل ما كان بـ<b>{fmt(confirm.createdAt)}</b>.
            </p>
            {changes.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">انتبه: عندك {changes.length} تعديلات لسا ما انتشرت — رح تنمسح.</p>}
            <p className="text-sm text-ink-muted">النسخة الحالية بتضل محفوظة بالسجل، فبتقدر ترجعلها كمان.</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
