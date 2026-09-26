"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { editDetailsAction } from "@/app/admin/documents/actions";
import { Button } from "@/components/ui/buttons";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import type { DocumentListItem } from "@/lib/domain";
import { Field, inputClass } from "./fields";

export function EditDocumentDialog({
  doc,
  categories,
  onClose,
}: {
  doc: DocumentListItem | null;
  categories: string[];
  onClose: () => void;
}) {
  const t = useTranslations();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) return;
    /* eslint-disable react-hooks/set-state-in-effect -- load the row into the form when opened */
    setTitle(doc.title);
    setCategory(doc.category ?? "");
    setDescription(doc.description ?? "");
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [doc]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!doc) return;
    setSaving(true);
    const result = await editDetailsAction({ documentId: doc.id, title, category, description }).catch(() => null);
    setSaving(false);
    if (result?.ok) {
      toast(t("toast.saved"));
      onClose();
    } else {
      setError(t(`errors.${result?.error ?? "generic"}`));
    }
  }

  return (
    <Dialog
      open={!!doc}
      onClose={onClose}
      title={t("editDoc.title")}
      footer={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="primary" type="submit" form="edit-doc-form" disabled={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="edit-doc-form" onSubmit={save} className="space-y-4">
        <Field label={t("newDoc.docTitle")}>
          <input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("newDoc.category")}>
          <input
            list="edit-category-options"
            maxLength={100}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("newDoc.categoryPlaceholder")}
            className={inputClass}
          />
          <datalist id="edit-category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label={t("newDoc.description")} hint={t("newDoc.descriptionHint")}>
          <textarea
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} h-auto py-2`}
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
