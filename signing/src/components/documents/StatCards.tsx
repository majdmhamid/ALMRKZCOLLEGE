"use client";

import { CheckCircle2, Clock, FileText, HardDrive, RefreshCw, Stamp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { DocumentStats } from "@/lib/domain";
import { useFormatters } from "@/lib/format";

export function StatCards({ stats }: { stats: DocumentStats }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  const cards = [
    { label: t("stats.total"), value: stats.total, icon: FileText, tone: "text-slate-700 bg-slate-100" },
    {
      label: t("stats.storage"),
      value: fmt.mb(stats.storage_bytes),
      sub: t("stats.storageFiles", { n: stats.file_count }),
      icon: HardDrive,
      tone: "text-sky-700 bg-sky-100",
    },
    { label: t("stats.signed"), value: stats.signed, icon: CheckCircle2, tone: "text-signed bg-green-100" },
    { label: t("stats.waiting"), value: stats.waiting, icon: Clock, tone: "text-waiting bg-orange-100" },
    { label: t("stats.finalized"), value: stats.finalized, icon: Stamp, tone: "text-final bg-violet-100" },
  ];

  return (
    <div className="mb-6 flex items-stretch gap-3">
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-sm">
            <span className={`hidden size-10 shrink-0 place-items-center rounded-xl sm:grid ${c.tone}`}>
              <c.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs text-muted">{c.label}</div>
              <div className="text-xl font-bold leading-tight">
                <span dir="ltr">{c.value}</span>
              </div>
              {c.sub && <div className="truncate text-[11px] text-muted">{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        aria-label={t("documents.refresh")}
        title={t("documents.refresh")}
        className="grid w-11 shrink-0 place-items-center rounded-2xl border border-line bg-card text-slate-600 shadow-sm hover:bg-slate-50"
      >
        <RefreshCw className={`size-[18px] ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
