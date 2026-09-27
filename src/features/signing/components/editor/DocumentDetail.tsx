"use client";

import { ArrowRight, ClipboardCopy, Download, FileCheck2, FileText, History, LockOpen, MapPin, PenLine } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { finalizeAction, unlockAction } from "@/app/admin/(panel)/documents/actions";
import { AdminSignDialog } from "@/features/signing/components/documents/AdminSignDialog";
import { ShareDialog } from "@/features/signing/components/documents/ShareDialog";
import { StatusBadge } from "@/features/signing/components/StatusBadge";
import { ConfirmDialog } from "@/features/signing/components/ui/ConfirmDialog";
import { useToast } from "@/features/signing/components/ui/Toast";
import { adminPending, allSigned, documentBadges, expectedClientSigners, signedClientCount, type DocumentListItem } from "@/features/signing/lib/domain";
import type { Placement } from "@/features/signing/server/repo/placements";
import type { EditorSignature, HistoryEvent } from "@/features/signing/server/services/editor";
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
  const [editor, setEditor] = useState({ saved: true, placements: 0, unplaced: 0 });
  const [confirm, setConfirm] = useState<"finalize" | "unlock" | null>(null);
  const [working, setWorking] = useState(false);
  const [adminSigning, setAdminSigning] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const onStatus = useCallback((s: typeof editor) => setEditor(s), []);
  const expected = expectedClientSigners(doc);
  const signed = signedClientCount(doc);
  const finalized = doc.status === "finalized";
  const ready = allSigned(doc);
  const canFinalize = !finalized && ready && editor.saved && editor.placements > 0;

  const run = async (action: "finalize" | "unlock") => {
    setWorking(true);
    const result = await (action === "finalize" ? finalizeAction(doc.id) : unlockAction(doc.id)).catch(() => null);
    setWorking(false);
    setConfirm(null);
    if (result?.ok) {
      toast(t(action === "finalize" ? "finalize.done" : "finalize.unlocked"));
      // The editor must start again from the server state (read-only ↔ editable).
      router.refresh();
    } else toast(t(`finalize.errors.${result?.error ?? "invalid"}`), "error");
  };

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
          {!finalized && adminPending(doc) && (
            <button
              type="button"
              onClick={() => setAdminSigning(true)}
              data-testid="admin-sign"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-admin px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <PenLine className="size-4" />
              {t("rowActions.adminSign")}
            </button>
          )}
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
            {finalized ? t("finalize.downloadFinal") : t("detail.download")}
          </a>
          {finalized && (
            <a
              href={`/admin/documents/${doc.id}/file?kind=original&download=1`}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted hover:bg-slate-100 hover:text-ink"
            >
              {t("finalize.downloadOriginal")}
            </a>
          )}
          {finalized ? (
            <button
              type="button"
              onClick={() => setConfirm("unlock")}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-final hover:bg-violet-100"
            >
              <LockOpen className="size-4" />
              {t("finalize.unlock")}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canFinalize}
              title={ready ? undefined : t("finalize.notReady")}
              onClick={() => setConfirm("finalize")}
              data-testid="finalize"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-brand hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <FileCheck2 className="size-4" />
              {t("finalize.button")}
            </button>
          )}
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
        {/* key: remount from server data when finalized ↔ unlocked. */}
        <PlacementEditor
          key={doc.status}
          documentId={doc.id}
          signatures={signatures}
          initialPlacements={placements}
          readOnly={finalized}
          onStatus={onStatus}
        />
      </div>
      {tab === "history" && <HistoryList events={history} />}

      <ShareDialog documentId={sharing ? doc.id : null} initial={null} onClose={() => setSharing(false)} />
      <AdminSignDialog documentId={adminSigning ? doc.id : null} onClose={() => setAdminSigning(false)} />
      <ConfirmDialog
        open={confirm === "finalize"}
        title={t("finalize.confirmTitle")}
        body={
          <>
            <p>{t("finalize.confirmBody")}</p>
            {editor.unplaced > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-800">{t("finalize.unplacedWarning", { n: editor.unplaced })}</p>
            )}
          </>
        }
        confirmLabel={working ? t("finalize.working") : t("finalize.button")}
        onConfirm={() => run("finalize")}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "unlock"}
        danger
        title={t("finalize.unlockTitle")}
        body={t("finalize.unlockBody")}
        confirmLabel={t("finalize.unlock")}
        onConfirm={() => run("unlock")}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
