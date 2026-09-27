"use client";

import { ArrowLeftRight, CheckSquare, Trash2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  deleteDocumentsAction,
  getShareInfoAction,
  moveDocumentsAction,
  recordLinkCopiedAction,
} from "@/app/admin/documents/actions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/buttons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { copyWhenReady } from "@/lib/clipboard";
import { documentBadges, type DocumentListItem, type DocumentStats, type LinkMode } from "@/lib/domain";
import type { ShareInfo } from "@/server/services/links";
import type { NotificationItem } from "@/server/repo/notifications";
import { DocumentGroups } from "./DocumentGroups";
import type { RowHandlers } from "./DocumentRow";
import { EditDocumentDialog } from "./EditDocumentDialog";
import { AdminSignDialog } from "./AdminSignDialog";
import { NewDocumentDialog } from "./NewDocumentDialog";
import { ShareDialog } from "./ShareDialog";
import { StatCards } from "./StatCards";
import { TopBar, type StatusFilter } from "./TopBar";
import { UploadZone } from "./UploadZone";

export type DocumentsViewProps = {
  section: "active" | "signed";
  docs: DocumentListItem[];
  stats: DocumentStats;
  unread: number;
  notifications: NotificationItem[];
  categories: string[];
  defaultLinkMode: LinkMode;
};

/** Lowercase, strip Hebrew niqqud/Arabic harakat so search matches however it was typed. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[֑-ׇً-ٰٟ]/g, "");
}

function matches(doc: DocumentListItem, filter: StatusFilter, query: string): boolean {
  if (filter !== "all" && !documentBadges(doc).includes(filter)) return false;
  if (!query) return true;
  const haystack = normalize([doc.title, doc.category ?? "", doc.file_name ?? "", ...doc.signers.map((s) => s.name)].join(" "));
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function DocumentsView(props: DocumentsViewProps) {
  const { section, docs, stats } = props;
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [queue, setQueue] = useState<File[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [draftToComplete, setDraftToComplete] = useState<DocumentListItem | null>(null);
  const [editing, setEditing] = useState<DocumentListItem | null>(null);
  const [deleting, setDeleting] = useState<DocumentListItem[] | null>(null);
  const [sharing, setSharing] = useState<{ id: string; info: ShareInfo | null } | null>(null);
  const [adminSigning, setAdminSigning] = useState<string | null>(null);

  const visible = useMemo(() => docs.filter((d) => matches(d, filter, search.trim())), [docs, filter, search]);
  const dateOf = useCallback(
    (d: DocumentListItem) => (section === "signed" ? (d.moved_to_signed_at ?? d.created_at) : d.created_at),
    [section],
  );

  const openFiles = (files: File[]) => {
    setQueue(files);
    setDraftToComplete(null);
    setNewOpen(true);
  };
  const closeNew = () => {
    // Several files dropped at once: open the next one.
    const rest = queue.slice(1);
    setQueue(rest);
    setDraftToComplete(null);
    setNewOpen(false);
    if (rest.length) setTimeout(() => setNewOpen(true), 150);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = async (ids: string[]) => {
    const toSigned = section === "active";
    const result = await moveDocumentsAction(ids, toSigned).catch(() => null);
    if (!result?.ok) return toast(t("errors.generic"), "error");
    if (result.moved) toast(t(toSigned ? "move.movedToSigned" : "move.movedBack", { n: result.moved }));
    if (result.skipped) toast(t("move.skipped", { n: result.skipped }), "error");
    setSelected(new Set());
    setSelectMode(false);
  };

  const handlers: RowHandlers = {
    onMove: (doc) => void move([doc.id]),
    onAdminSign: (doc) => setAdminSigning(doc.id),
    onOpen: (doc) => router.push(`/admin/documents/${doc.id}`),
    onView: (doc) => window.open(`/admin/documents/${doc.id}/file`, "_blank", "noopener"),
    onEdit: setEditing,
    onDelete: (doc) => setDeleting([doc]),
    onCopyLink: (doc) => {
      const activeLinks =
        doc.link_mode === "shared"
          ? Number(doc.has_shared_link)
          : doc.signers.filter((s) => !s.is_admin && s.status === "pending" && s.has_link).length;
      if (activeLinks !== 1) {
        setSharing({ id: doc.id, info: null });
        return;
      }
      // One link: copy it on this click (the dialog then offers WhatsApp etc.).
      const info = getShareInfoAction(doc.id);
      const message = info.then((i) => i?.links.find((l) => l.message)?.message ?? Promise.reject(new Error("no link")));
      void copyWhenReady(message).then((ok) => {
        toast(ok ? t("share.copied") : t("share.copyFailed"), ok ? "ok" : "error");
        if (ok) void info.then((i) => i && recordLinkCopiedAction({ documentId: doc.id, signerId: i.links.find((l) => l.message)?.signerId ?? null }));
      });
      void info.then((i) => setSharing({ id: doc.id, info: i }));
    },
    onComplete: (doc) => {
      setQueue([]);
      setDraftToComplete(doc);
      setNewOpen(true);
    },
  };

  return (
    <>
      <TopBar
        unread={props.unread}
        notifications={props.notifications}
        filter={filter}
        onFilter={setFilter}
        search={search}
        onSearch={setSearch}
        onNewCase={() => openFiles([])}
      />

      <PageHeader
        title={t(section === "signed" ? "signedPage.title" : "documents.title")}
        subtitle={t(section === "signed" ? "signedPage.subtitle" : "documents.subtitle")}
        actions={
          <>
            {section === "active" && (
              <Button variant="primary" icon={Upload} onClick={() => openFiles([])}>
                {t("documents.upload")}
              </Button>
            )}
            <Button
              icon={selectMode ? X : CheckSquare}
              aria-pressed={selectMode}
              onClick={() => {
                setSelectMode((m) => !m);
                setSelected(new Set());
              }}
            >
              {selectMode ? t("documents.cancelSelect") : t("documents.select")}
            </Button>
          </>
        }
      />

      {section === "active" && <StatCards stats={stats} />}
      {section === "active" && <UploadZone onFiles={openFiles} />}

      {selectMode && (
        <div className="sticky top-2 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-brand-800/10 bg-brand-700 px-4 py-2.5 text-sm text-white shadow-lg">
          <span className="font-semibold">{t("documents.selectedCount", { n: selected.size })}</span>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setSelected(new Set(visible.map((d) => d.id)))}
          >
            {t("documents.selectAll")}
          </button>
          <div className="ms-auto flex gap-2">
            <button
              type="button"
              disabled={!selected.size}
              onClick={() => void move([...selected])}
              data-testid="bulk-move"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25 disabled:opacity-40"
            >
              <ArrowLeftRight className="size-4" />
              {t(section === "active" ? "move.toSigned" : "move.back")}
            </button>
            <button
              type="button"
              disabled={!selected.size}
              onClick={() => setDeleting(docs.filter((d) => selected.has(d.id)))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 font-semibold hover:bg-red-500 disabled:opacity-40"
            >
              <Trash2 className="size-4" />
              {t("documents.deleteSelected")}
            </button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">
          {docs.length === 0 ? t(section === "signed" ? "signedPage.empty" : "documents.empty") : t("documents.noResults")}
        </div>
      ) : (
        <DocumentGroups
          docs={visible}
          scope={section}
          dateOf={dateOf}
          selectMode={selectMode}
          selected={selected}
          onToggleSelect={toggleSelect}
          handlers={handlers}
          forceOpen={!!search.trim()}
        />
      )}

      <NewDocumentDialog
        open={newOpen}
        file={queue[0] ?? null}
        draft={draftToComplete}
        defaultLinkMode={props.defaultLinkMode}
        categories={props.categories}
        onClose={closeNew}
      />
      <AdminSignDialog documentId={adminSigning} onClose={() => setAdminSigning(null)} />
      <ShareDialog documentId={sharing?.id ?? null} initial={sharing?.info ?? null} onClose={() => setSharing(null)} />
      <EditDocumentDialog doc={editing} categories={props.categories} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        danger
        title={
          deleting && deleting.length > 1 ? t("confirmDelete.titleMany", { n: deleting.length }) : t("confirmDelete.title")
        }
        body={
          <>
            {deleting?.length === 1 && <p className="mb-2 font-semibold text-ink">{deleting[0].title}</p>}
            <p>{t("confirmDelete.body")}</p>
          </>
        }
        confirmLabel={t("confirmDelete.confirm")}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteDocumentsAction(deleting.map((d) => d.id));
          if (result.ok) {
            toast(t("toast.deleted", { n: result.deleted }));
            setSelected(new Set());
            setSelectMode(false);
          } else toast(t("errors.generic"), "error");
          setDeleting(null);
        }}
      />
    </>
  );
}
