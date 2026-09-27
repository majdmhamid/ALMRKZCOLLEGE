"use client";

import {
  ArrowLeftRight,
  ClipboardCopy,
  Download,
  Eye,
  FilePen,
  FileText,
  PenLine,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/features/signing/components/StatusBadge";
import { IconButton } from "@/features/signing/components/ui/buttons";
import {
  adminPending,
  documentBadges,
  expectedClientSigners,
  signedClientCount,
  type DocumentListItem,
} from "@/features/signing/lib/domain";
import { useFormatters } from "@/features/signing/lib/format";

export type RowHandlers = {
  /** Row click: the document page (editor + history). */
  onOpen: (doc: DocumentListItem) => void;
  /** Eye button: the PDF itself. */
  onView: (doc: DocumentListItem) => void;
  onEdit: (doc: DocumentListItem) => void;
  onDelete: (doc: DocumentListItem) => void;
  onComplete?: (doc: DocumentListItem) => void;
  onCopyLink?: (doc: DocumentListItem) => void;
  onMove?: (doc: DocumentListItem) => void;
  onAdminSign?: (doc: DocumentListItem) => void;
};

export function DocumentRow({
  doc,
  selectMode,
  selected,
  onToggleSelect,
  handlers,
}: {
  doc: DocumentListItem;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  handlers: RowHandlers;
}) {
  const t = useTranslations();
  const fmt = useFormatters();
  const badges = documentBadges(doc);
  const expected = expectedClientSigners(doc);
  const signed = signedClientCount(doc);
  const isDraft = doc.status === "draft";
  const canMove = doc.in_signed_section || doc.status === "signed" || doc.status === "finalized";
  // Shown even when every link was revoked, so the admin can issue a new one.
  const canShare =
    !isDraft &&
    doc.status !== "finalized" &&
    (doc.link_mode === "shared" || doc.signers.some((s) => !s.is_admin && s.status === "pending"));

  return (
    <li
      data-testid="document-row"
      data-status={doc.status}
      className={`group flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 transition-colors sm:flex-nowrap sm:px-4 ${
        selected ? "bg-blue-50/70" : "hover:bg-slate-50"
      }`}
    >
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(doc.id)}
          aria-label={t("rowActions.select", { title: doc.title })}
          className="size-4.5 shrink-0 accent-brand-600"
        />
      )}

      <button
        type="button"
        onClick={() => (selectMode ? onToggleSelect(doc.id) : isDraft ? handlers.onComplete?.(doc) : handlers.onOpen(doc))}
        className="flex min-w-0 basis-full items-center gap-3 text-start sm:basis-auto sm:flex-1"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
          <FileText className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{doc.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {doc.category && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{doc.category}</span>
            )}
            {!isDraft && (expected === null || expected > 0) && (
              <span data-testid="progress">
                {expected === null ? t("progress.open", { signed }) : t("progress.of", { signed, expected })}
              </span>
            )}
            {doc.page_count && <span>· {t("newDoc.pages", { n: doc.page_count })}</span>}
            <span>· {fmt.time(doc.created_at)}</span>
          </span>
        </span>
      </button>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {badges.map((b) => (
          <StatusBadge key={b} kind={b} />
        ))}
      </div>

      {!selectMode && (
        <div className="flex flex-1 shrink-0 items-center justify-end gap-1.5 sm:flex-none">
          {isDraft ? (
            <IconButton icon={FilePen} label={t("rowActions.complete")} tone="blue" onClick={() => handlers.onComplete?.(doc)} />
          ) : (
            <>
              {handlers.onAdminSign && doc.admin_signs && adminPending(doc) && (
                <IconButton icon={PenLine} label={t("rowActions.adminSign")} tone="blue" onClick={() => handlers.onAdminSign?.(doc)} />
              )}
              {handlers.onCopyLink && canShare && (
                <IconButton icon={ClipboardCopy} label={t("rowActions.copyLink")} tone="orange" onClick={() => handlers.onCopyLink?.(doc)} />
              )}
              {handlers.onMove && canMove && (
                <IconButton
                  icon={ArrowLeftRight}
                  label={t(doc.in_signed_section ? "rowActions.moveBack" : "rowActions.moveToSigned")}
                  tone="green"
                  onClick={() => handlers.onMove?.(doc)}
                />
              )}
              <IconButton icon={Eye} label={t("rowActions.view")} onClick={() => handlers.onView(doc)} />
              <a
                href={`/admin/documents/${doc.id}/file?download=1`}
                aria-label={t("rowActions.download")}
                title={t("rowActions.download")}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-card text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink"
              >
                <Download className="size-[18px]" />
              </a>
              <IconButton icon={Pencil} label={t("rowActions.edit")} onClick={() => handlers.onEdit(doc)} />
            </>
          )}
          <IconButton icon={Trash2} label={t("rowActions.delete")} tone="red" onClick={() => handlers.onDelete(doc)} />
        </div>
      )}
    </li>
  );
}
