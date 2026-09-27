"use client";

import { Link2, PenLine, Type, UserCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Field, inputClass } from "@/features/signing/components/documents/fields";
import { SignaturePad, type SignaturePadHandle } from "@/features/signing/components/signature/SignaturePad";
import { Button } from "@/features/signing/components/ui/buttons";
import { useToast } from "@/features/signing/components/ui/Toast";
import type { LinkMode, SettingsDto } from "@/features/signing/lib/domain";
import { buildShareMessage } from "@/features/signing/lib/share";
import { deleteProfileSignatureAction, saveProfileSignatureAction, saveSettingsAction } from "@/features/signing/actions/settings";

export function SettingsForm({ initial, savedSignatureUrl }: { initial: SettingsDto; savedSignatureUrl: string | null }) {
  const t = useTranslations("settingsPage");
  const tDoc = useTranslations("newDoc");
  const tErr = useTranslations("errors");
  const tSign = useTranslations("sign");
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof SettingsDto>(key: K, value: SettingsDto[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const preview = buildShareMessage({
    template: s.message_template,
    description: t("previewDescription"),
    url: "https://…/sign/…",
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await saveSettingsAction(s).catch(() => null);
            toast(result?.ok ? t("saved") : tErr("generic"), result?.ok ? "ok" : "error");
          });
        }}
        className="space-y-6"
      >
        <Card title={t("methodsTitle")} hint={t("methodsHint")}>
          <div className="space-y-2">
            <Toggle icon={PenLine} label={t("draw")} hint={t("alwaysOn")} checked disabled onChange={() => {}} />
            <Toggle
              icon={Type}
              label={t("typed")}
              hint={t("typedHint")}
              checked={s.allow_typed_signature}
              onChange={(v) => set("allow_typed_signature", v)}
            />
            <Toggle
              icon={UserCheck}
              label={t("checkbox")}
              hint={t("checkboxHint")}
              checked={s.allow_checkbox_signature}
              onChange={(v) => set("allow_checkbox_signature", v)}
            />
          </div>
        </Card>

        <Card title={t("linkModeTitle")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["per_signer", Users, tDoc("perSigner"), tDoc("perSignerHint")],
                ["shared", Link2, tDoc("shared"), tDoc("sharedHint")],
              ] as const
            ).map(([mode, Icon, label, hint]) => (
              <label
                key={mode}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                  s.default_link_mode === mode ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="default_link_mode"
                  className="sr-only"
                  checked={s.default_link_mode === mode}
                  onChange={() => set("default_link_mode", mode as LinkMode)}
                />
                <Icon className={`mt-0.5 size-5 shrink-0 ${s.default_link_mode === mode ? "text-brand-600" : "text-muted"}`} />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card title={t("templateTitle")}>
          <Field label={t("templateTitle")} hint={t("templateHint")}>
            <textarea
              rows={3}
              maxLength={2000}
              value={s.message_template}
              placeholder={t("templatePlaceholder")}
              onChange={(e) => set("message_template", e.target.value)}
              className={`${inputClass} h-auto py-2`}
            />
          </Field>
          <div className="mt-4">
            <div className="mb-1.5 text-sm font-medium">{t("preview")}</div>
            <div className="max-w-sm whitespace-pre-line rounded-2xl rounded-ss-sm bg-[#dcf8c6] px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 shadow-card">
              {preview}
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={pending} data-testid="save-settings">
            {t("save")}
          </Button>
        </div>
      </form>

      <SavedSignatureCard url={savedSignatureUrl} clearLabel={tSign("clear")} />
    </div>
  );
}

function SavedSignatureCard({ url, clearLabel }: { url: string | null; clearLabel: string }) {
  const t = useTranslations("settingsPage");
  const tAdmin = useTranslations("adminSign");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const pad = useRef<SignaturePadHandle>(null);
  const [drawing, setDrawing] = useState(!url);
  const [empty, setEmpty] = useState(true);
  const [pending, startTransition] = useTransition();

  return (
    <Card title={t("signatureTitle")} hint={t("signatureHint")}>
      {url && !drawing ? (
        <div className="space-y-3">
          <div className="grid h-36 place-items-center rounded-2xl border border-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
            <img src={url} alt={t("signatureTitle")} className="max-h-full max-w-full object-contain" data-testid="saved-signature" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDrawing(true)}>{t("replace")}</Button>
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteProfileSignatureAction();
                  toast(t("signatureDeleted"));
                  setDrawing(true);
                })
              }
            >
              {t("deleteSignature")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!url && <p className="text-sm text-muted">{t("noSignature")}</p>}
          <SignaturePad ref={pad} onChange={setEmpty} hint={tAdmin("drawHint")} clearLabel={clearLabel} height={170} />
          <div className="flex gap-2">
            <Button
              variant="primary"
              disabled={empty || pending}
              onClick={() => {
                const dataUrl = pad.current?.toDataUrl();
                if (!dataUrl) return;
                startTransition(async () => {
                  const result = await saveProfileSignatureAction(dataUrl).catch(() => null);
                  if (result?.ok) {
                    toast(t("signatureSaved"));
                    setDrawing(false);
                  } else toast(tAdmin("errors.image"), "error");
                });
              }}
            >
              {t("saveSignature")}
            </Button>
            {url && <Button onClick={() => setDrawing(false)}>{tCommon("cancel")}</Button>}
          </div>
        </div>
      )}
    </Card>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <h2 className="font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Toggle({
  icon: Icon,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  icon: typeof PenLine;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border border-line p-3 ${disabled ? "bg-slate-50" : "cursor-pointer hover:bg-slate-50"}`}>
      <Icon className="size-5 shrink-0 text-brand-600" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {/* Knob sits at the start when off, the end when on — works in RTL and LTR. */}
      <span
        aria-hidden
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-brand-400 ${
          checked ? "justify-end bg-brand-600" : "justify-start bg-slate-300"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span className="size-5 rounded-full bg-white shadow" />
      </span>
    </label>
  );
}
