"use client";

import { ArrowRight, ClipboardCopy, Download, FileText, History, MapPin } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ShareDialog } from "@/components/documents/ShareDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { documentBadges, expectedClientSigners, signedClientCount, type DocumentListItem } from "@/lib/domain";
import type { Placement } from "@/server/repo/placements";
import type { EditorSignature, HistoryEvent } from "@/server/services/editor";
import { HistoryList } from "./HistoryList";
import { PlacementEditor } from "./PlacementEditor";

export function DocumentDetail({
  doc,
  signatures,
  placements,
  history,
}: {
  doc: DocumentListItem;
  signatures: EditorSignature[];
  placements: Placement[];
  history: HistoryEvent[];
}) {
  const t = useTranslations();
  const [tab, setTab] = useState<"editor" | "history">("editor");
  const [sharing, setSharing] = useState(false);
  const expected = expectedClientSigners(doc);
  const signed = signedClientCount(doc);
  const finalized = doc.status === "finalized";
  const canShare = !finalized && (doc.link_mode === "shared" || doc.signers.some((s) => !s.is_admin && s.status === "pending"));

  return (
    <>
      <Link
        href={doc.in_signed_section ? "/admin/signed" : "/admin/documents"}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand-700"
      >
        <ArrowRight className="size-4" />
        {doc.in_signed_section ? t("signedPage.title") : t("detail.back")}
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">{doc.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
              {documentBadges(doc).map((b) => (
                <StatusBadge key={b} kind={b} />
              ))}
              {doc.category && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">{doc.category}</span>}
              <span>{expected === null ? t("progress.open", { signed }) : t("progress.of", { signed, expected })}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canShare && (
            <button
              type="button"
              onClick={() => setSharing(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-waiting px-4 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <ClipboardCopy className="size-4" />
              {t("detail.share")}
            </button>
          )}
          <a
            href={`/admin/documents/${doc.id}/file?download=1`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:bg-slate-50"
          >
            <Download className="size-4" />
            {t("detail.download")}
          </a>
        </div>
      </header>

      <div role="tablist" className="mb-4 inline-flex rounded-xl border border-line bg-card p-1 shadow-card">
        {(
          [
            ["editor", MapPin, t("detail.tabEditor")],
            ["history", History, t("detail.tabHistory")],
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold ${
              tab === id ? "bg-brand-600 text-white" : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Keep the editor mounted while viewing history so unsaved moves aren't lost. */}
      <div hidden={tab !== "editor"}>
        <PlacementEditor documentId={doc.id} signatures={signatures} initialPlacements={placements} readOnly={finalized} />
      </div>
      {tab === "history" && <HistoryList events={history} />}

      <ShareDialog documentId={sharing ? doc.id : null} initial={null} onClose={() => setSharing(false)} />
    </>
  );
}
