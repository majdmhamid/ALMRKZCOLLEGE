"use client";

import { ArrowRight, Monitor, SquareGanttChart } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { StatusBadge } from "./bits";

/**
 * شاشة تعديل كبيرة: الاستمارة على اليمين، والمعاينة الحيّة على اليسار (ثابتة وأنت تنزل).
 */
export default function SplitEditor({
  backHref,
  backLabel,
  title,
  status,
  form,
  previews,
  headerActions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  status: "new" | "changed" | null;
  form: ReactNode;
  previews: { key: string; label: string; icon?: "card" | "page"; node: ReactNode }[];
  headerActions?: ReactNode;
}) {
  const [tab, setTab] = useState(previews[0]?.key);
  const current = previews.find((p) => p.key === tab) ?? previews[0];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-brand-700 hover:bg-brand-50">
          <ArrowRight size={16} /> {backLabel}
        </Link>
        <h1 className="relative flex min-w-0 flex-1 items-center gap-2 text-2xl font-extrabold md:text-3xl">
          <span className="truncate">{title}</span>
          {status && (
            <span className="relative inline-block h-7 w-16">
              <StatusBadge status={status} />
            </span>
          )}
        </h1>
        {headerActions}
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-6">{form}</div>
        <aside className="space-y-3 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-ink-muted">معاينة حيّة — بتتغيّر وأنت بتكتب</p>
            {previews.length > 1 && (
              <div className="inline-flex rounded-xl border border-line bg-white p-1 text-sm font-bold">
                {previews.map((p) => (
                  <button key={p.key} type="button" onClick={() => setTab(p.key)} aria-pressed={p.key === current?.key} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${p.key === current?.key ? "bg-brand-600 text-white" : "text-ink-muted hover:text-ink"}`}>
                    {p.icon === "page" ? <Monitor size={15} /> : <SquareGanttChart size={15} />}
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-[1.25rem]">{current?.node}</div>
        </aside>
      </div>
    </div>
  );
}
