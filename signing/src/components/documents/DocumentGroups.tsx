"use client";

import { ChevronDown, Folder, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { groupByMonthDay, type DocumentListItem } from "@/lib/domain";
import { useFormatters } from "@/lib/format";
import { DocumentRow, type RowHandlers } from "./DocumentRow";

const STORAGE_KEY = "signing.collapsedGroups";

/** Collapsed month/day keys, remembered per browser (a convenience; safe to lose). */
function useCollapsed(scope: string) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}.${scope}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* storage unavailable */
    }
  }, [scope]);
  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(`${STORAGE_KEY}.${scope}`, JSON.stringify([...next]));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  return { collapsed, toggle };
}

export function DocumentGroups({
  docs,
  scope,
  dateOf,
  selectMode,
  selected,
  onToggleSelect,
  handlers,
  forceOpen,
}: {
  docs: DocumentListItem[];
  scope: string;
  dateOf: (d: DocumentListItem) => string;
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  handlers: RowHandlers;
  /** While searching, show every match regardless of collapsed folders. */
  forceOpen: boolean;
}) {
  const t = useTranslations("documents");
  const fmt = useFormatters();
  const months = useMemo(() => groupByMonthDay(docs, dateOf), [docs, dateOf]);
  const { collapsed, toggle } = useCollapsed(scope);

  return (
    <div className="space-y-4">
      {months.map((month) => {
        const monthOpen = forceOpen || !collapsed.has(month.key);
        return (
          <section key={month.key} data-testid="month-group" className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
            <button
              type="button"
              onClick={() => toggle(month.key)}
              aria-expanded={monthOpen}
              className="flex w-full items-center gap-2 bg-slate-50/80 px-4 py-3 text-start hover:bg-slate-100/80"
            >
              <ChevronDown className={`size-4 text-muted transition-transform ${monthOpen ? "" : "rotate-90"}`} />
              <span className="font-bold">{fmt.month(month.date)}</span>
              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-600">
                {t("docCount", { n: month.count })}
              </span>
            </button>
            {monthOpen && (
              <div className="divide-y divide-line border-t border-line">
                {month.days.map((day) => {
                  const dayOpen = forceOpen || !collapsed.has(day.key);
                  return (
                    <div key={day.key} data-testid="day-group">
                      <button
                        type="button"
                        onClick={() => toggle(day.key)}
                        aria-expanded={dayOpen}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm hover:bg-slate-50"
                      >
                        {dayOpen ? (
                          <FolderOpen className="size-4 text-amber-500" />
                        ) : (
                          <Folder className="size-4 text-amber-500" />
                        )}
                        <span className="font-semibold text-slate-700">{fmt.day(day.date)}</span>
                        <span className="text-xs text-muted">({day.items.length})</span>
                      </button>
                      {dayOpen && (
                        <ul className="divide-y divide-line/70 border-t border-line/70 bg-card ps-2 sm:ps-6">
                          {day.items.map((doc) => (
                            <DocumentRow
                              key={doc.id}
                              doc={doc}
                              selectMode={selectMode}
                              selected={selected.has(doc.id)}
                              onToggleSelect={onToggleSelect}
                              handlers={handlers}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
