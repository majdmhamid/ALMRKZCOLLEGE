"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { adminSignAction, getSavedSignatureAction } from "@/app/admin/(panel)/documents/actions";
import { SignaturePad, type SignaturePadHandle } from "@/features/signing/components/signature/SignaturePad";
import { Button } from "@/features/signing/components/ui/buttons";
import { Dialog } from "@/features/signing/components/ui/Dialog";
import { useToast } from "@/features/signing/components/ui/Toast";

/**
 * Blue pen: the admin signs a document. Offers the signature saved on the
 * profile; otherwise (or on request) a drawing pad with "save for next time".
 */
export function AdminSignDialog({ documentId, onClose }: { documentId: string | null; onClose: () => void }) {
  const t = useTranslations("adminSign");
  const tCommon = useTranslations("common");
  const tSign = useTranslations("sign");
  const toast = useToast();
  const pad = useRef<SignaturePadHandle>(null);
  const [saved, setSaved] = useState<{ url: string } | null | undefined>(undefined);
  const [mode, setMode] = useState<"saved" | "draw">("draw");
  const [empty, setEmpty] = useState(true);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reset when opened */
    setSaved(undefined);
    setError(null);
    setEmpty(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    void getSavedSignatureAction().then((s) => {
      setSaved(s);
      setMode(s ? "saved" : "draw");
    });
  }, [documentId]);

  async function sign() {
    if (!documentId) return;
    const dataUrl = mode === "draw" ? pad.current?.toDataUrl() : undefined;
    if (mode === "draw" && !dataUrl) return setError(t("errors.invalid"));
    setBusy(true);
    const result = await adminSignAction({
      documentId,
      useSaved: mode === "saved",
      dataUrl: dataUrl ?? undefined,
      saveToProfile: mode === "draw" && remember,
    }).catch(() => null);
    setBusy(false);
    if (result?.ok) {
      toast(t("done"));
      onClose();
    } else setError(t(`errors.${result?.error ?? "invalid"}`));
  }

  return (
    <Dialog
      open={!!documentId}
      onClose={onClose}
      title={t("title")}
      footer={
        <>
          <Button onClick={onClose}>{tCommon("cancel")}</Button>
          <Button
            variant="primary"
            disabled={busy || saved === undefined || (mode === "draw" && empty)}
            onClick={sign}
            data-testid="admin-sign-submit"
          >
            {busy ? t("signing") : t("sign")}
          </Button>
        </>
      }
    >
      {saved === undefined ? (
        <p className="py-8 text-center text-sm text-muted">…</p>
      ) : (
        <div className="space-y-4">
          {saved && (
            <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {(["saved", "draw"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={`min-h-10 rounded-lg text-sm font-semibold ${mode === m ? "bg-card text-ink shadow-card" : "text-muted"}`}
                >
                  {m === "saved" ? t("useSaved") : t("drawNew")}
                </button>
              ))}
            </div>
          )}
          {mode === "saved" && saved ? (
            <figure className="rounded-2xl border border-line bg-white p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
              <img src={saved.url} alt={t("savedLabel")} className="mx-auto max-h-32 object-contain" />
              <figcaption className="mt-2 text-xs text-muted">{t("savedLabel")}</figcaption>
            </figure>
          ) : (
            <>
              <SignaturePad ref={pad} onChange={setEmpty} hint={t("drawHint")} clearLabel={tSign("clear")} height={190} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-brand-600" />
                {t("saveForNext")}
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
