"use client";

import { Bell, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { markNotificationsReadAction } from "@/features/signing/actions/documents";
import { useFormatters } from "@/features/signing/lib/format";
import type { NotificationItem } from "@/features/signing/server/repo/notifications";

export type StatusFilter = "all" | "admin" | "waiting" | "signed" | "finalized" | "draft";
export const STATUS_FILTERS: StatusFilter[] = ["all", "admin", "waiting", "signed", "finalized", "draft"];

export function TopBar({
  unread,
  notifications,
  filter,
  onFilter,
  search,
  onSearch,
  onNewCase,
}: {
  unread: number;
  notifications: NotificationItem[];
  filter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  search: string;
  onSearch: (s: string) => void;
  onNewCase: () => void;
}) {
  const t = useTranslations();
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K / ⌘K focuses quick search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-2 shadow-card">
      <button
        type="button"
        onClick={onNewCase}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-brand hover:bg-brand-700"
      >
        <Plus className="size-4" strokeWidth={2.5} />
        {t("documents.newCase")}
      </button>

      <NotificationBell unread={unread} notifications={notifications} />

      <label className="relative">
        <span className="sr-only">{t("filter.label")}</span>
        <select
          value={filter}
          onChange={(e) => onFilter(e.target.value as StatusFilter)}
          className="min-h-10 appearance-none rounded-xl border border-line bg-card ps-3 pe-8 text-sm font-medium outline-none focus:border-brand-500"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f} value={f}>
              {t(`filter.${f}`)}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-xs text-muted">
          ▾
        </span>
      </label>

      <label className="relative ms-auto min-w-0 flex-1 basis-56 sm:max-w-sm">
        <span className="sr-only">{t("documents.search")}</span>
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("documents.search")}
          className="min-h-10 w-full rounded-xl border border-line bg-slate-50 ps-9 pe-16 text-sm outline-none focus:border-brand-500 focus:bg-card"
        />
        <kbd className="pointer-events-none absolute inset-y-0 end-2 my-auto hidden h-6 items-center rounded-md border border-line bg-card px-1.5 text-[11px] font-medium text-muted sm:flex">
          <span dir="ltr">Ctrl+K</span>
        </kbd>
      </label>
    </div>
  );
}

function NotificationBell({ unread, notifications }: { unread: number; notifications: NotificationItem[] }) {
  const t = useTranslations("bell");
  const fmt = useFormatters();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${t("title")}${unread ? ` (${unread})` : ""}`}
        className="relative grid size-10 place-items-center rounded-xl border border-line bg-card text-slate-600 hover:bg-slate-50"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span
            data-testid="bell-count"
            className="absolute -top-1.5 -end-1.5 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-card"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute start-0 top-12 z-30 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold">{t("title")}</span>
            {unread > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => markNotificationsReadAction())}
                className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
              >
                {t("markRead")}
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">{t("empty")}</li>}
            {notifications.map((n) => (
              <li key={n.id} className={`border-b border-line/60 px-4 py-3 text-sm last:border-0 ${n.read_at ? "" : "bg-blue-50/50"}`}>
                <div>{t("signed", { name: n.signer_name ?? "—", doc: n.document_title })}</div>
                <div className="mt-0.5 text-end text-xs text-muted">{fmt.dateTime(n.created_at)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
