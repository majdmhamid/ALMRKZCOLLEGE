"use client";

import { FileText, Link2, Plus, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  completeDocumentAction,
  discardDraftAction,
  startUploadAction,
} from "@/features/signing/actions/documents";
import { Button } from "@/features/signing/components/ui/buttons";
import { Dialog } from "@/features/signing/components/ui/Dialog";
import { useToast } from "@/features/signing/components/ui/Toast";
import { MAX_UPLOAD_BYTES, type DocumentListItem, type LinkMode } from "@/features/signing/lib/domain";
import { Field, inputClass } from "./fields";

type SignerDraft = { key: number; name: string; phone: string };
type Upload =
  | { state: "idle" }
  | { state: "uploading"; pct: number; documentId?: string }
  | { state: "done"; documentId: string }
  | { state: "error"; error: string; documentId?: string };

let signerKey = 0;
const blankSigner = (): SignerDraft => ({ key: ++signerKey, name: "", phone: "" });

/** PUT with progress events (fetch has no upload progress). */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Dialog closed mid-upload: stop, so no orphan file lands in storage after the draft is discarded.
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "application/pdf");
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function NewDocumentDialog({
  open,
  file,
  draft,
  defaultLinkMode,
  categories,
  onClose,
}: {
  open: boolean;
  /** A file picked/dropped outside the dialog. */
  file: File | null;
  /** An existing draft to finish (its file is already uploaded). */
  draft: DocumentListItem | null;
  defaultLinkMode: LinkMode;
  categories: string[];
  onClose: () => void;
}) {
  const t = useTranslations();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<Upload>({ state: "idle" });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [linkMode, setLinkMode] = useState<LinkMode>(defaultLinkMode);
  const [maxSigners, setMaxSigners] = useState("");
  const [adminSigns, setAdminSigns] = useState(false);
  const [signers, setSigners] = useState<SignerDraft[]>([blankSigner()]);
  const [error, setError] = useState<{ text: string; index?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const completed = useRef(false);

  const currentFile = pickedFile ?? file;
  const documentId = draft?.id ?? (upload.state !== "idle" ? upload.documentId : undefined);

  // Reset whenever the dialog opens for a new file/draft.
  useEffect(() => {
    if (!open) return;
    completed.current = false;
    /* eslint-disable react-hooks/set-state-in-effect -- form reset when the dialog opens */
    setPickedFile(null);
    setUpload(draft ? { state: "done", documentId: draft.id } : { state: "idle" });
    setTitle(draft?.title ?? (file ? file.name.replace(/\.pdf$/i, "") : ""));
    setCategory(draft?.category ?? "");
    setDescription(draft?.description ?? "");
    setLinkMode(draft?.link_mode ?? defaultLinkMode);
    setMaxSigners("");
    setAdminSigns(false);
    setSigners([blankSigner()]);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, file, draft, defaultLinkMode]);

  // Start uploading as soon as there is a file.
  useEffect(() => {
    if (!open || !currentFile || draft) return;
    let cancelled = false;
    const abort = new AbortController();
    (async () => {
      if (!/\.pdf$/i.test(currentFile.name) && currentFile.type !== "application/pdf") {
        setUpload({ state: "error", error: "not_pdf" });
        return;
      }
      if (currentFile.size > MAX_UPLOAD_BYTES) {
        setUpload({ state: "error", error: "too_large" });
        return;
      }
      setUpload({ state: "uploading", pct: 0 });
      const started = await startUploadAction({
        fileName: currentFile.name.toLowerCase().endsWith(".pdf") ? currentFile.name : `${currentFile.name}.pdf`,
        size: currentFile.size,
        linkMode: "per_signer",
      });
      if (cancelled) {
        if (started.ok) void discardDraftAction(started.documentId);
        return;
      }
      if (!started.ok) {
        setUpload({ state: "error", error: started.error });
        return;
      }
      setUpload({ state: "uploading", pct: 0, documentId: started.documentId });
      try {
        await putWithProgress(started.uploadUrl, currentFile, (pct) =>
          setUpload({ state: "uploading", pct, documentId: started.documentId }),
          abort.signal,
        );
        if (!cancelled) setUpload({ state: "done", documentId: started.documentId });
      } catch {
        if (!cancelled) setUpload({ state: "error", error: "upload_failed", documentId: started.documentId });
      }
    })();
    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [open, currentFile, draft]);

  function close() {
    // Cancelled before "Create": throw the half-made draft away (not for drafts reopened from the list).
    if (!completed.current && !draft && documentId) void discardDraftAction(documentId);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (upload.state !== "done") return;
    setSaving(true);
    setError(null);
    const result = await completeDocumentAction({
      documentId: upload.documentId,
      title,
      category,
      description,
      linkMode,
      maxSigners: linkMode === "shared" && maxSigners ? Number(maxSigners) : null,
      adminSigns,
      signers: linkMode === "per_signer" ? signers.map(({ name, phone }) => ({ name, phone })) : [],
    }).catch(() => ({ ok: false as const, error: "generic" as const, index: undefined }));
    setSaving(false);
    if (result.ok) {
      completed.current = true;
      toast(t("toast.created"));
      onClose();
    } else {
      setError({ text: t(`errors.${result.error}`), index: "index" in result ? result.index : undefined });
    }
  }

  const updateSigner = (key: number, patch: Partial<SignerDraft>) =>
    setSigners((all) => all.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t("newDoc.title")}
      size="lg"
      footer={
        <>
          <Button onClick={close}>{t("common.cancel")}</Button>
          <Button variant="primary" type="submit" form="new-doc-form" disabled={upload.state !== "done" || saving}>
            {saving ? t("newDoc.creating") : t("newDoc.create")}
          </Button>
        </>
      }
    >
      <form id="new-doc-form" onSubmit={submit} className="space-y-5">
        {/* File */}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{draft?.file_name ?? currentFile?.name ?? t("newDoc.file")}</div>
            <UploadStatus upload={upload} />
          </div>
          {!draft && (
            <>
              <Button onClick={() => fileInput.current?.click()} disabled={upload.state === "uploading"}>
                {t("newDoc.chooseFile")}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (documentId) void discardDraftAction(documentId);
                  setPickedFile(f);
                  if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
                }}
              />
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("newDoc.docTitle")}>
            <input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("newDoc.category")}>
            <input
              list="category-options"
              maxLength={100}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t("newDoc.categoryPlaceholder")}
              className={inputClass}
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label={t("newDoc.description")} hint={t("newDoc.descriptionHint")}>
          <textarea
            rows={2}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-16 py-2`}
          />
        </Field>

        {/* Link mode */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("newDoc.linkMode")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["per_signer", Users, t("newDoc.perSigner"), t("newDoc.perSignerHint")],
                ["shared", Link2, t("newDoc.shared"), t("newDoc.sharedHint")],
              ] as const
            ).map(([mode, Icon, label, hint]) => (
              <label
                key={mode}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                  linkMode === mode ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="linkMode"
                  value={mode}
                  checked={linkMode === mode}
                  onChange={() => setLinkMode(mode)}
                  className="sr-only"
                />
                <Icon className={`mt-0.5 size-5 shrink-0 ${linkMode === mode ? "text-brand-600" : "text-muted"}`} />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {linkMode === "per_signer" ? (
          <div>
            <div className="mb-2 text-sm font-medium">{t("newDoc.signers")}</div>
            <div className="space-y-2">
              {signers.map((s, index) => (
                <div
                  key={s.key}
                  data-testid="signer-input"
                  className={`grid grid-cols-[1fr_auto] gap-2 rounded-xl border p-2 sm:grid-cols-[1.4fr_1fr_auto] ${
                    error?.index === index ? "border-red-300 bg-red-50/50" : "border-line"
                  }`}
                >
                  <input
                    required
                    aria-label={t("newDoc.signerName")}
                    placeholder={t("newDoc.signerName")}
                    value={s.name}
                    maxLength={120}
                    onChange={(e) => updateSigner(s.key, { name: e.target.value })}
                    className={`${inputClass} col-span-2 sm:col-span-1`}
                  />
                  <input
                    type="tel"
                    aria-label={t("newDoc.signerPhone")}
                    placeholder={t("newDoc.signerPhone")}
                    value={s.phone}
                    maxLength={30}
                    dir="ltr"
                    onChange={(e) => updateSigner(s.key, { phone: e.target.value })}
                    className={`${inputClass} text-end`}
                  />
                  <button
                    type="button"
                    disabled={signers.length === 1}
                    onClick={() => setSigners((all) => all.filter((x) => x.key !== s.key))}
                    aria-label={t("newDoc.removeSigner")}
                    className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSigners((all) => [...all, blankSigner()])}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Plus className="size-4" />
              {t("newDoc.addSigner")}
            </button>
          </div>
        ) : (
          <Field label={t("newDoc.maxSigners")}>
            <input
              type="number"
              min={1}
              max={500}
              inputMode="numeric"
              value={maxSigners}
              onChange={(e) => setMaxSigners(e.target.value)}
              className={`${inputClass} max-w-40`}
            />
          </Field>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={adminSigns}
            onChange={(e) => setAdminSigns(e.target.checked)}
            className="mt-0.5 size-4.5 accent-brand-600"
          />
          <span>
            <span className="block text-sm font-semibold">{t("newDoc.adminSigns")}</span>
            <span className="block text-xs text-muted">{t("newDoc.adminSignsHint")}</span>
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.text}
          </p>
        )}
      </form>
    </Dialog>
  );
}

function UploadStatus({ upload }: { upload: Upload }) {
  const t = useTranslations();
  if (upload.state === "idle") return null;
  if (upload.state === "error") return <div className="text-xs font-medium text-red-600">{t(`errors.${upload.error}`)}</div>;
  if (upload.state === "done") return <div className="text-xs font-medium text-signed">✓ {t("newDoc.uploaded")}</div>;
  return (
    <div className="mt-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${upload.pct}%` }} />
      </div>
      <div className="mt-0.5 text-[11px] text-muted">{t("newDoc.uploading", { pct: upload.pct })}</div>
    </div>
  );
}
