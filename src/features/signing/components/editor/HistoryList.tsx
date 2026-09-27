"use client";

import {
  CheckCircle2,
  Clipboard,
  Eye,
  FileCheck2,
  FilePlus2,
  FolderInput,
  KeyRound,
  Lock,
  LockOpen,
  MapPin,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { AuditEventType } from "@/features/signing/lib/domain";
import { useFormatters } from "@/features/signing/lib/format";
import type { HistoryEvent } from "@/features/signing/server/services/editor";

const icons: Record<AuditEventType, { icon: LucideIcon; tone: string }> = {
  created: { icon: FilePlus2, tone: "bg-brand-50 text-brand-700" },
  updated: { icon: Pencil, tone: "bg-slate-100 text-slate-600" },
  deleted: { icon: Trash2, tone: "bg-red-50 text-red-600" },
  link_copied: { icon: Clipboard, tone: "bg-orange-50 text-waiting" },
  link_revoked: { icon: Lock, tone: "bg-red-50 text-red-600" },
  link_regenerated: { icon: KeyRound, tone: "bg-orange-50 text-waiting" },
  link_reset: { icon: LockOpen, tone: "bg-slate-100 text-slate-600" },
  opened: { icon: Eye, tone: "bg-slate-100 text-slate-600" },
  id_failed: { icon: ShieldAlert, tone: "bg-red-50 text-red-600" },
  id_locked: { icon: Lock, tone: "bg-red-100 text-red-700" },
  id_verified: { icon: ShieldCheck, tone: "bg-brand-50 text-brand-700" },
  signed: { icon: CheckCircle2, tone: "bg-brand-100 text-brand-700" },
  placed: { icon: MapPin, tone: "bg-blue-50 text-admin" },
  finalized: { icon: FileCheck2, tone: "bg-violet-50 text-final" },
  unlocked: { icon: LockOpen, tone: "bg-violet-50 text-final" },
  moved_to_signed: { icon: FolderInput, tone: "bg-brand-50 text-brand-700" },
  moved_back: { icon: FolderInput, tone: "bg-slate-100 text-slate-600" },
};

/** The document's audit trail, newest first. */
export function HistoryList({ events }: { events: HistoryEvent[] }) {
  const t = useTranslations("history");
  const fmt = useFormatters();
  if (!events.length) return <p className="rounded-2xl border border-line bg-card p-8 text-center text-sm text-muted">{t("empty")}</p>;

  return (
    <ol data-testid="history" className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      {events.map((e) => {
        const { icon: Icon, tone } = icons[e.event] ?? icons.updated;
        const sha = typeof e.details?.sha256 === "string" ? (e.details.sha256 as string) : null;
        const name = e.signer_name ?? (typeof e.details?.name === "string" ? (e.details.name as string) : null);
        return (
          <li key={e.id} className="flex items-start gap-3 px-4 py-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${tone}`}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {t(e.event)}
                {name && <span className="font-normal text-slate-600"> · {name}</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                <span>{fmt.dateTime(e.created_at)}</span>
                {e.ip && (
                  <span dir="ltr" className="font-mono">
                    {e.ip}
                  </span>
                )}
                {sha && (
                  <span dir="ltr" className="font-mono" title={sha}>
                    SHA-256 {sha.slice(0, 12)}…
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
