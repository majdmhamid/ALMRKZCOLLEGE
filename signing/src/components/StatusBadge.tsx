"use client";

import { useTranslations } from "next-intl";
import type { BadgeKind } from "@/lib/domain";

const styles: Record<BadgeKind, string> = {
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  admin: "bg-blue-50 text-admin ring-blue-200",
  waiting: "bg-orange-50 text-waiting ring-orange-200",
  signed: "bg-green-50 text-signed ring-green-200",
  finalized: "bg-violet-50 text-final ring-violet-200",
};

export function StatusBadge({ kind }: { kind: BadgeKind }) {
  const t = useTranslations("badge");
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[kind]}`}
    >
      {t(kind)}
    </span>
  );
}
